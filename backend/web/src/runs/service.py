from uuid import uuid4
from typing import cast, Any

from celery import chord, group
from celery.canvas import Signature
from fastapi import HTTPException
from sqlmodel import Session
import logging

from .schemas import TestcaseStartRunRequest, TestsuiteStartRunRequest
from src.projects.models import Role as ProjectRole, Project
from src.projects.queries import get_with_link
from src.llms.models import LLMModel
from src.llms.queries import get_model_by_id
from src.runs.celery_app import app
from src.runs.models import (
    RunMode,
    RunStatus,
    Scope,
    TestCaseRun,
    TestSuiteRun,
)
from src.runs.schemas import StartRunResponse
from src.runs.stream import abort_async, get_stream_key
from src.testcases.models import TestCase
from src.testsuites.models import TestSuite
from src.base.schemas import Scope
from src.auth.models import User

logger = logging.getLogger(__name__)


def _generate_uuid() -> str:
    return str(uuid4())


def _build_testsuite_workflow_signature(
    *,
    testcase_runs_ids: list[int],
    testcase_job_uids: list[str],
    testsuite_run_id: int,
    stream_key: str,
    abort_id: int,
    stream_steps: bool,
) -> Signature:
    header = group(
        app.signature(
            "runs.execute_testcase",
            kwargs={
                "testcase_run_id": testcase_run_id,
                "stream_key": stream_key,
                "abort_id": abort_id,
                "stream_steps": stream_steps,
            },
            options={"task_id": job_uid},
        )
        for testcase_run_id, job_uid in zip(testcase_runs_ids, testcase_job_uids)
    )

    callback = app.signature(
        "runs.finalize_testsuite",
        kwargs={
            "testsuite_run_id": testsuite_run_id,
            "stream_key": stream_key,
        },
    )
    return chord(header, callback)

def _get_model_or_throw(session: Session, llm_model_id: int):
    llm_model = get_model_by_id(session, llm_model_id)

    if llm_model is None:
        raise HTTPException(status_code=404, detail="Model does not exist")
    
    if llm_model.provider.api_key is None:
        raise HTTPException(status_code=400, detail="API Key for this model is not set")
    
    if llm_model.provider.api_key is None:
        HTTPException(status_code=400, detail="API Key for this model is not set")

def launch_testcase_run(
    session: Session,
    testcase: TestCase,
    request: TestcaseStartRunRequest,
    user: User
) -> StartRunResponse:
    
    llm_model = _get_model_or_throw(session, request.llm_model_id)
    mode = request.mode

    job_uid = _generate_uuid()
    logger.info("Launching testcase run: testcase_id=%s mode=%s job_uid=%s", testcase.id, mode, job_uid)
    test_case_run = TestCaseRun(
        scope=Scope.TESTCASE,
        mode=mode,
        status=RunStatus.QUEUED,
        job_uid=job_uid,
        testcase_id=testcase.id,  # type: ignore[arg-type]
        base_url=testcase.base_url,
        name=testcase.name,
        instruction=testcase.instruction,
        testsuite_run_id = None,
        llm_model_id=request.llm_model_id,
        user_id=user.id,
        use_screenshots=request.use_screenshots,
        use_video=request.use_video
    )

    session.add(test_case_run)
    session.flush()

    testcase_run_id = cast(int, test_case_run.id)
    stream_key = get_stream_key(Scope.TESTCASE, testcase_run_id)  
    
    app.send_task(
        "runs.execute_testcase",
        kwargs={
            "testcase_run_id": testcase_run_id,
            "stream_key": stream_key,
            "abort_id": testcase_run_id,
            "stream_steps": True,
        },
        task_id=job_uid,
    )

    session.commit()

    logger.info(
        "Scheduled execute_testcase task: testcase_run_id=%s job_uid=%s stream_key=%s",
        testcase_run_id,
        job_uid,
        stream_key,
    )

    return StartRunResponse(
        scope=Scope.TESTCASE.value,
        run_id=testcase_run_id, 
        mode=test_case_run.mode,
        status=test_case_run.status,
        created_at=test_case_run.created_at,
    )


def launch_testsuite_run(
    session: Session,
    testsuite: TestSuite,
    request: TestsuiteStartRunRequest,
    user: User
) -> StartRunResponse:
    llm_model = _get_model_or_throw(
        session=session, 
        llm_model_id=request.llm_model_id
    )

    testcases = list(testsuite.testcases)
    if not testcases:
        raise HTTPException(status_code=400, detail="Test suite has no test cases")

    suite_job_uid = _generate_uuid()
    testcase_job_uids = [_generate_uuid() for _ in testcases]

    testsuite_run = TestSuiteRun(
        scope=Scope.TESTSUITE,
        mode=request.mode,
        job_uid=suite_job_uid,
        testsuite_id=testsuite.id,  # type: ignore[arg-type]
        name=testsuite.name,
        llm_model_id=request.llm_model_id,
        user_id=user.id,
        use_screenshots=request.use_screenshots,
        use_video=request.use_video
    )
    session.add(testsuite_run)
    session.flush()

    testcase_runs = [
        TestCaseRun(
            scope=Scope.TESTSUITE,
            mode=request.mode,
            job_uid=job_uid,
            testcase_id=testcase.id,  # type: ignore[arg-type]
            testsuite_run_id=testsuite_run.id,
            name=testcase.name,
            base_url=testcase.base_url,
            instruction=testcase.instruction,
            llm_model_id=request.llm_model_id,
            user_id=user.id,
            use_screenshots=request.use_screenshots,
            use_video=request.use_video
        )
        for testcase, job_uid in zip(testcases, testcase_job_uids)
    ]
    session.add_all(testcase_runs)
    session.flush()

    testcase_runs_ids: list[int] = [cast(int, run.id) for run in testcase_runs]

    testsuite_run_id = cast(int, testsuite_run.id)
    mode_val = testsuite_run.mode
    status_val = testsuite_run.status
    created_at_val = testsuite_run.created_at

    session.commit()

    stream_key = get_stream_key(Scope.TESTSUITE, testsuite_run_id)

    workflow = _build_testsuite_workflow_signature(
        testcase_runs_ids=testcase_runs_ids,
        testcase_job_uids=testcase_job_uids,
        testsuite_run_id=testsuite_run_id,
        stream_key=stream_key,
        abort_id=testsuite_run_id,
        stream_steps=True,
        use_screenshots=request.use_screenshots,
        use_video=request.use_video
    )
    workflow.apply_async(task_id=suite_job_uid)  

    return StartRunResponse(
        scope=Scope.TESTSUITE,
        run_id=testsuite_run_id,
        mode=mode_val,
        status=status_val,
        created_at=created_at_val,
    )


async def abort_testcase_run(
    testcase_run: TestCaseRun,
):
    if testcase_run.scope != Scope.TESTCASE:
        raise HTTPException(status_code=400, detail="Only standalone testcase runs can be aborted directly")

    await abort_async(cast(int, testcase_run.id))


async def abort_testsuite_run(
    testsuite_run: TestSuiteRun
) :
    if testsuite_run.scope != Scope.TESTSUITE:
        raise HTTPException(status_code=400, detail="Only standalone testsuite runs can be aborted directly")

    await abort_async(cast(int, testsuite_run.id))


def stop_predicate_factory(scope: Scope):
    def stop_predicate(message: dict[Any, Any]) -> bool:
        if "type" not in message:
            return False
        
        msg_type = message['type']
        
        if msg_type != 'STATUS_CHANGE':
            return False

        if "event" not in message:
            return False
        
        event = message['event']

        if 'element' not in event:
            return False
        
        if event['element'] != scope.value:
            return False

        if "status" not in event:
            return False

        return event['status'] in ['PASSED', 'FAILED', 'ERROR', 'ABORTED']
    
    return stop_predicate