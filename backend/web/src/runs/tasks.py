import asyncio
from datetime import datetime
from typing import Any
import logging

from automation_engine import BrowserConfig, EngineConfig, TestingEngine
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
    ProjectOutcomePayload,
    aggregate_parent_status,
    stream_status,
)
from src.models import *
from src.runs.models import RunStatus, Scope

logger = logging.getLogger(__name__)

def _build_testing_engine() -> TestingEngine:
    return TestingEngine(
        config=EngineConfig(
            browser=BrowserConfig(headless=True),
        ),
    )


class ExecuteTestcaseTask(Task):
    name = "runs.execute_testcase"
    autoretry_for = (Exception,)
    retry_backoff = True
    max_retries = 2

    def run(
        self,
        testcase_run_id: int,
        stream_key: str,
        abort_id: int,
        stream_steps: bool = True,
    ) -> dict[str, Any]:
        testing_engine = _build_testing_engine()

        with Session(db_engine) as db_session:
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


@app.task(
    name="runs.finalize_project", 
    autoretry_for=(Exception,), 
    retry_backoff=True, 
    max_retries=3
)
def finalize_project_task(
    testsuite_outcomes: list[dict[str, Any]],
    project_run_id: int,
    stream_key: str,
) -> dict[str, Any]:
    parsed_outcomes = [TestSuiteOutcomePayload.model_validate(item) for item in testsuite_outcomes]

    with Session(db_engine, expire_on_commit=False) as db_session:
        project_run = db_session.get(ProjectRun, project_run_id)
        if project_run is None:
            raise ValueError(f"ProjectRun {project_run_id} not found")

        status = aggregate_parent_status(item.status for item in parsed_outcomes)
        finished_at = max((item.finished_at for item in parsed_outcomes if item.finished_at), default=datetime.now())
        started_at = min((item.started_at for item in parsed_outcomes if item.started_at), default=datetime.now())

        project_run.status = status
        project_run.finished_at = finished_at
        project_run.started_at = started_at
        db_session.add(project_run)
        db_session.commit()

        stream_status(
            stream_key,
            event=StatusChangeEvent(
                element=Scope.PROJECT,
                id=project_run.project_id,
                status=status,
            ),
        )

    return ProjectOutcomePayload(
        project_run_id=project_run_id,
        status=status,
        started_at=started_at,
        finished_at=finished_at,
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


def build_project_workflow(
    *,
    testsuite_workflows: list[Signature],
    project_run_id: int,
    stream_key: str,
) -> Signature:
    callback = finalize_project_task.s(
        project_run_id=project_run_id,
        stream_key=stream_key,
    )
    return chord(group(testsuite_workflows), callback)


app.register_task(ExecuteTestcaseTask())
execute_testcase_task = app.tasks["runs.execute_testcase"]
