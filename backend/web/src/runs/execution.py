from datetime import datetime, timezone
from typing import Iterable, cast
from enum import StrEnum
from uuid import uuid4
import json
import logging

from automation_engine import (
    ExecAction,
    TestRun,
    TestStep,
    TestStatus as AutomationEngineTestStatus,
    TestingEngine,
    TestTermination
)
from pydantic import BaseModel, Field
from sqlmodel import Session
from src.file_storage.s3 import get_s3_storage, S3FileStorage, FileIdentifier
from src.config import settings

from src.runs.models import (
    RunMode,
    RunStatus,
    Scope,
    TestCaseRun,
    TestCaseStepRunStatus,
    TestStepRun,
)
from src.runs.stream import is_aborted, stream_event

logger = logging.getLogger(__name__)

StepType = TestStep | TestTermination

class EventType(StrEnum):
    STATUS_CHANGE = "STATUS_CHANGE"
    TEST_STEP = "TEST_STEP"
    TEST_TERMINATION = "TEST_TERMINATION"

class StatusChangeEvent(BaseModel):
    time: datetime = Field(default_factory=datetime.now)
    element: Scope
    id: int
    status: RunStatus

class TestCaseOutcomePayload(BaseModel):
    testcase_run_id: int
    testcase_id: int
    status: RunStatus
    finished_at: datetime
    started_at: datetime
    termination_reason: str | None = None

    @classmethod
    def from_testcase_run(cls, testcase_run: TestCaseRun) -> "TestCaseOutcomePayload":
        return cls(
            testcase_run_id=cast(int, testcase_run.id),
            testcase_id=testcase_run.testcase_id,
            status=testcase_run.status,
            finished_at=testcase_run.finished_at, # type: ignore
            started_at=cast(datetime, testcase_run.started_at),
            termination_reason=testcase_run.termination_reason,
        )

class TestSuiteOutcomePayload(BaseModel):
    testsuite_run_id: int
    testsuite_id: int
    status: RunStatus
    finished_at: datetime
    started_at: datetime

class ProjectOutcomePayload(BaseModel):
    project_run_id: int
    status: RunStatus
    finished_at: datetime
    started_at: datetime

def to_run_status(status: AutomationEngineTestStatus) -> RunStatus:
    return RunStatus(status.value)

def to_test_step_run_status(status: AutomationEngineTestStatus) -> TestCaseStepRunStatus:
    return TestCaseStepRunStatus(status.value)

def aggregate_parent_status(statuses: Iterable[RunStatus]) -> RunStatus:
    statuses = list(statuses)
    if any(status == RunStatus.ABORTED for status in statuses):
        return RunStatus.ABORTED
    if any(status == RunStatus.FAILED for status in statuses):
        return RunStatus.FAILED
    return RunStatus.PASSED

def generate_uuid() -> str:
    return str(uuid4())

async def upload_screenshot(image: bytes, key: str | None = None) -> str:
    if not key:
        key = generate_uuid()
    logger.debug("Uploading screenshot to S3: key=%s size=%d", key, len(image))
    screenshots_bucket = settings.S3_SCREENSHOTS_BUCKET
    s3_storage = get_s3_storage()
    identifier = FileIdentifier(bucket=screenshots_bucket, key=key)
    result = await s3_storage.upload_image(
        identifier=identifier,
        image=image,
    )
    logger.debug("Uploaded screenshot to %s", result.url)
    return result.url
    
async def stream_step(
    stream_key: str,
    *,
    step: StepType,
    testcase_id: int,
    snapshot_before_url: str | None = None,
    snapshot_after_url: str | None = None,
):
    if isinstance(step, TestStep):
        data = step.model_dump(mode="json", exclude={"snapshot_before", "snapshot_after"})
        if step.executable:
            data["executable"] = step.executable.model_dump(mode="json")
        
        if step.action:
            data["action_description"] = step.action.recreation_prompt
        
        if step.snapshot_before:
            url = snapshot_before_url or await upload_screenshot(step.snapshot_before.screenshot)
            data["snapshot_before"] = {
                'screenshot': url
            }

        if step.snapshot_after:
            url = snapshot_after_url or await upload_screenshot(step.snapshot_after.screenshot)
            data["snapshot_after"] = {
                'screenshot': url
            }
            
        data["testcase_id"] = testcase_id

        data = json.dumps(data)
        event_type = EventType.TEST_STEP
        logger.debug("Streaming test step for stream_key=%s step=%s", stream_key, getattr(step, 'id', None))

    elif isinstance(step, TestTermination):
        data_dict = step.model_dump(mode="json")
        data_dict["testcase_id"] = testcase_id
        data = json.dumps(data_dict)
        event_type = EventType.TEST_TERMINATION
        logger.debug("Streaming test termination for stream_key=%s data=%s", stream_key, data)

    stream_event(stream_key, event=data, event_type=event_type)

    
def stream_status(stream_key: str, *, event: StatusChangeEvent):
    logger.debug("Streaming status change: stream_key=%s element=%s id=%s status=%s", stream_key, event.element, event.id, event.status)
    stream_event(
        stream_key,
        event_type=EventType.STATUS_CHANGE,
        event=event.model_dump_json(),
    )

class TestCaseJob:
    def __init__(
        self,
        testcase_run_id: int,
        *,
        engine: TestingEngine,
        db_session: Session,
        stream_key: str,
        abort_id: int,
        stream_steps: bool = True,
    ) -> None:
        self.testcase_run_id = testcase_run_id
        self.abort_id = abort_id
        self.engine = engine
        self.stream_key = stream_key
        self.stream_steps = stream_steps
        self.db_session = db_session

        self.testcase_run: TestCaseRun | None = None

    async def _stream_step(
        self,
        step: StepType,
        *,
        snapshot_before_url: str | None = None,
        snapshot_after_url: str | None = None,
    ) -> None:
        assert self.testcase_run
        await stream_step(
            self.stream_key,
            step=step,
            testcase_id=self.testcase_run.testcase_id,
            snapshot_before_url=snapshot_before_url,
            snapshot_after_url=snapshot_after_url,
        )

    def _stream_status(self, status: RunStatus) -> None:
        assert self.testcase_run
        stream_status(
            self.stream_key,
            event= StatusChangeEvent(
                element=Scope.TESTCASE,
                id=self.testcase_run.testcase_id,
                status=status,
            ),
        )

    def _is_aborted(self) -> bool:
        return is_aborted(abort_id=self.abort_id)

    def _finalize_aborted(self) -> TestCaseOutcomePayload:
        assert self.testcase_run
        logger.info("Finalizing aborted testcase run: testcase_run_id=%s", self.testcase_run.id)

        try:
            self.testcase_run.status = RunStatus.ABORTED
            self.testcase_run.finished_at = datetime.now(timezone.utc)
            self.testcase_run.termination_reason = "Execution aborted by user"
            self.db_session.add(self.testcase_run)
            self.db_session.commit()
        except Exception:
            self.db_session.rollback()
            raise

        self._stream_status(RunStatus.ABORTED)

        return TestCaseOutcomePayload.from_testcase_run(self.testcase_run)

    async def _upload_step_screenshots(self, step: TestStep) -> tuple[str | None, str | None]:
        screenshot_before = None
        if step.snapshot_before:
            screenshot_before = await upload_screenshot(step.snapshot_before.screenshot)

        screenshot_after = None
        if step.snapshot_after:
            screenshot_after = await upload_screenshot(step.snapshot_after.screenshot)

        return screenshot_before, screenshot_after


    async def _persist_step(
        self,
        step: TestStep,
        *,
        screenshot_before: str | None = None,
        screenshot_after: str | None = None,
    ) -> None:
        if step.status is None:
            return

        try:
            llm_action = step.action.model_dump() if step.action else None
        except:
            llm_action = None

        step_run = TestStepRun(
            testcase_run_id=self.testcase_run.id, # type: ignore[arg-type]
            executable=step.executable.model_dump(mode="json") if step.executable else None,
            screenshot_before=screenshot_before,
            screenshot_after=screenshot_after,
            error_message=step.error_message,
            llm_action=llm_action,
            intent=step.action.intent if step.action else None,
            recreation_prompt=step.action.recreation_prompt if step.action else None,
            status=to_test_step_run_status(step.status),
        )
        
        self.db_session.add(step_run)
        self.db_session.commit() 
        logger.debug("Persisted test step: testcase_run_id=%s step_status=%s", step_run.testcase_run_id, step_run.status)

    async def execute_testcase(self) -> TestCaseOutcomePayload:
        self.testcase_run = self.db_session.get(TestCaseRun, self.testcase_run_id)
        logger.info("Executing testcase: testcase_run_id=%s abort_id=%s stream_steps=%s", self.testcase_run_id, self.abort_id, self.stream_steps)

        if self.testcase_run is None:
            logger.error("TestCaseRun not found: id=%s", self.testcase_run_id)
            raise ValueError(f"TestCaseRun {self.testcase_run_id} not found")

        # status: queued -> running
        logger.info("TestCaseRun starting: id=%s testcase_id=%s", self.testcase_run.id, self.testcase_run.testcase_id)
        self.testcase_run.status = RunStatus.RUNNING
        self.testcase_run.started_at = datetime.now(timezone.utc)
        self.db_session.add(self.testcase_run)
        self.db_session.commit()
        self._stream_status(RunStatus.RUNNING)

        try:
            if self.testcase_run.mode == RunMode.NATURAL:
                assert self.testcase_run.instruction

                async with self.engine.launch(self.testcase_run.base_url) as run_session:
                    async for emitted in run_session.run_loop(
                        self.testcase_run.instruction
                    ):
                        if self._is_aborted():
                            logger.info("Abort detected during execution: testcase_run_id=%s", self.testcase_run_id)
                            return self._finalize_aborted()

                        if isinstance(emitted, TestStep):
                            screenshot_before_url = None
                            screenshot_after_url = None
                            if self.stream_steps or emitted.status is not None:
                                screenshot_before_url, screenshot_after_url = await self._upload_step_screenshots(emitted)

                            await self._persist_step(
                                emitted,
                                screenshot_before=screenshot_before_url,
                                screenshot_after=screenshot_after_url,
                            )
                            
                            if self.stream_steps:
                                await self._stream_step(
                                    emitted,
                                    snapshot_before_url=screenshot_before_url,
                                    snapshot_after_url=screenshot_after_url,
                                )

                    run_session.finalize()
                    run = cast(TestRun, run_session._test_run)

                status = to_run_status(run.status)
                logger.info("Test run finished: testcase_run_id=%s status=%s", self.testcase_run_id, status)

                # status: running -> passed/failed
                self.testcase_run.status = status
                self.testcase_run.finished_at = run.finished_at or datetime.now(timezone.utc)
                self.testcase_run.termination_reason = run.termination_reason
                self.db_session.add(self.testcase_run)
                self.db_session.commit()
                self._stream_status(status)
            
            elif self.testcase_run.mode == RunMode.EXECUTABLE:
                # Placeholder for executable mode
                self.testcase_run.status = RunStatus.PASSED
                self.testcase_run.finished_at = datetime.now(timezone.utc)
                self.db_session.add(self.testcase_run)
                self.db_session.commit()
                self._stream_status(RunStatus.PASSED)

        except Exception as e:
            logger.exception("Error during testcase execution: testcase_run_id=%s", self.testcase_run_id)
            self.testcase_run.status = RunStatus.ERROR
            self.testcase_run.finished_at = datetime.now(timezone.utc)
            self.testcase_run.termination_reason = str(e)
            self.db_session.add(self.testcase_run)
            self.db_session.commit()
            self._stream_status(RunStatus.ERROR)

        return TestCaseOutcomePayload.from_testcase_run(self.testcase_run)
