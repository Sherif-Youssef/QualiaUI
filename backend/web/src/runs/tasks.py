import asyncio
from datetime import datetime
from typing import Any
import logging
import tempfile
import shutil
import os

from automation_engine import BrowserConfig, EngineConfig, TestingEngine, LLMConfig
from celery import chord, group, Task
from celery.canvas import Signature
from sqlmodel import Session

from src.config import settings
from src.database import engine as db_engine
from src.runs.celery_app import app
from src.runs.execution import (
    StatusChangeEvent,
    TestCaseOutcomePayload,
    TestSuiteOutcomePayload,
    TestCaseJob,
    aggregate_parent_status,
    stream_status,
)
from src.base.schemas import Scope
from src.models import *
from src.runs.models import RunStatus, Scope

from .schemas import RunStatus

logger = logging.getLogger(__name__)

def _build_testing_engine(llm_model: LLMModel, use_screenshots: bool, record_video_dir: str | None = None) -> TestingEngine:
    return TestingEngine(
        config=EngineConfig(
            browser=BrowserConfig(headless=True, record_video_dir=record_video_dir),
            llm=LLMConfig(
                provider=llm_model.provider.provider_type.value,
                model=llm_model.model_name,
                api_key=llm_model.provider.api_key,
                base_url=llm_model.provider.base_url,
                additional_kwargs=llm_model.provider.additional_config,
                use_screenshot=use_screenshots
            )
        ),
    )


@app.task(name="runs.upload_video")
def upload_video_task(testcase_run_id: int, video_path: str, video_dir: str):
    from src.runs.execution import upload_video
    from pathlib import Path
    
    try:
        with Session(db_engine) as db_session:
            testcase_run = db_session.get(TestCaseRun, testcase_run_id)
            if not testcase_run:
                logger.error(f"TestCaseRun {testcase_run_id} not found for video upload")
                return

            v_path = Path(video_path)
            if v_path.exists():
                video_url = asyncio.run(upload_video(v_path))
                testcase_run.video_url = video_url
                db_session.add(testcase_run)
                db_session.commit()
                logger.info(f"Uploaded video for TestCaseRun {testcase_run_id}: {video_url}")
            else:
                logger.warning(f"Video file not found at {video_path}")
    except Exception:
        logger.exception(f"Failed to upload video for TestCaseRun {testcase_run_id}")
    finally:
        if video_dir and os.path.exists(video_dir):
            shutil.rmtree(video_dir)


class ExecuteTestcaseTask(Task):
    name = "runs.execute_testcase"

    def run(
        self,
        testcase_run_id: int,
        stream_key: str,
        abort_id: int,
        stream_steps: bool = True,
    ) -> dict[str, Any]:
        with Session(db_engine) as db_session:
            testcase_run = db_session.get(TestCaseRun, testcase_run_id)
            if testcase_run is None:
                raise ValueError(f"TestCaseRun {testcase_run_id} not found")
            
            if testcase_run.llm_model is None:
                raise ValueError(f"TestCaseRun {testcase_run_id} has no LLM model")
            
            if testcase_run.llm_model.provider.api_key is None:
                raise ValueError(f"LLM Model {testcase_run.llm_model.id} API key is not set")

            video_dir = None
            if testcase_run.use_video:
                video_dir = tempfile.mkdtemp()

            testing_engine = _build_testing_engine(
                llm_model=testcase_run.llm_model,
                use_screenshots=testcase_run.use_screenshots,
                record_video_dir=video_dir
            )

            try:
                outcome = asyncio.run(
                    TestCaseJob(
                        testcase_run_id,
                        engine=testing_engine,
                        db_session=db_session,
                        stream_key=stream_key,
                        abort_id=abort_id,
                        stream_steps=stream_steps,
                    ).execute_testcase()
                )
            finally:
                if video_dir and os.path.exists(video_dir):
                    # Check if a video task was started. If it was, it will clean up.
                    # Otherwise, clean up now.
                    db_session.refresh(testcase_run)
                    if not testcase_run.video_upload_task_id:
                        shutil.rmtree(video_dir)

        return outcome.model_dump(mode="json")

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        testcase_run_id = args[0] if args else kwargs.get("testcase_run_id")
        stream_key = args[1] if args else kwargs.get("stream_key")
        if testcase_run_id is None:
            logger.info("TestCaseRun not found: id=%s", testcase_run_id)
            return
        
        with Session(db_engine) as db_session:
            logger.info("Marking TestCaseRun as ERROR: id=%s", testcase_run_id)
            testcase_run = db_session.get(TestCaseRun, testcase_run_id)
            if testcase_run is None:
                logger.warning("TestCaseRun not found: id=%s", testcase_run_id)
                return

            testcase_run.status = RunStatus.ERROR
            testcase_run.finished_at = datetime.now()
            testcase_run.termination_reason = "Unexpected Error"
            try:
                db_session.add(testcase_run)
                db_session.commit()
                logger.info("TestCaseRun updated to ERROR: id=%s", testcase_run_id)
            except Exception:
                db_session.rollback()
                logger.exception("Failed to update TestCaseRun to ERROR: id=%s", testcase_run_id)
                raise

            stream_status(
                stream_key,
                event=StatusChangeEvent(
                    element=Scope.TESTCASE,
                    id=testcase_run_id,
                    status=RunStatus.ERROR,
                    termination_reason="Unexpected Error"
                ),
            )


@app.task(
    name="runs.finalize_testsuite", 
    autoretry_for=(Exception,), 
    retry_backoff=True, 
    max_retries=3
)
def finalize_testsuite_task(
    testcase_outcomes: list[dict[str, Any]],
    testsuite_run_id: int,
    stream_key: str,
) -> dict[str, Any]:
    parsed_outcomes = [TestCaseOutcomePayload.model_validate(item) for item in testcase_outcomes]

    with Session(db_engine) as db_session:
        testsuite_run = db_session.get(TestSuiteRun, testsuite_run_id)
        if testsuite_run is None:
            logger.error("TestCaseRun not found: id=%s", testsuite_run_id)
            raise ValueError(f"TestSuiteRun {testsuite_run_id} not found")
        
        status = aggregate_parent_status(item.status for item in parsed_outcomes)
        finished_at = max((item.finished_at for item in parsed_outcomes if item.finished_at), default=datetime.now())
        started_at = min((item.started_at for item in parsed_outcomes if item.started_at), default=datetime.now())

        testsuite_run.status = status
        testsuite_run.finished_at = finished_at
        testsuite_run.started_at = started_at
        logger.info("Finalizing testsuite run: id=%s, status=%s, started_at=%s, finished_at=%s", 
                    testsuite_run_id, status, started_at, finished_at
        )
        
        db_session.add(testsuite_run)
        db_session.commit()

        stream_status(
            stream_key,
            event=StatusChangeEvent(
                element=Scope.TESTSUITE,
                id=testsuite_run.testsuite_id,
                status=status,
            ),
        )

    return TestSuiteOutcomePayload(
        testsuite_run_id=testsuite_run_id,
        testsuite_id=testsuite_run.testsuite_id,  # type: ignore[union-attr]
        status=status,
        started_at=started_at,
        finished_at=finished_at
    ).model_dump(mode="json")


def build_testsuite_workflow(
    *,
    testcase_runs_ids: list[int],
    testsuite_run_id: int,
    stream_key: str,
    abort_id: int,
    stream_steps: bool,
) -> Signature:
    header = group(
        execute_testcase_task.s(
            testcase_run_id=id,
            stream_key=stream_key,
            abort_id=abort_id,
            stream_steps=stream_steps,
        )
        for id in testcase_runs_ids
    )

    callback = finalize_testsuite_task.s(
        testsuite_run_id=testsuite_run_id,
        stream_key=stream_key,
    )

    return chord(header, callback)


app.register_task(ExecuteTestcaseTask())
execute_testcase_task = app.tasks["runs.execute_testcase"]
