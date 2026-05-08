from uuid import uuid4
from typing import cast, Any

from celery import chord, group
from celery.canvas import Signature
from fastapi import HTTPException
from sqlmodel import Session
import logging

from src.projects.models import Role as ProjectRole, Project
from src.projects.queries import get_with_link
from src.runs.celery_app import app
from src.runs.models import (
    ProjectRun,
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


def _build_project_workflow_signature(
    *,
    testsuite_workflows: list[Signature],
    project_run_id: int,
    stream_key: str,
) -> Signature:
    callback = app.signature(
        "runs.finalize_project",
        kwargs={
            "project_run_id": project_run_id,
            "stream_key": stream_key,
        },
    )
    return chord(group(testsuite_workflows), callback)


def launch_testcase_run(
    session: Session,
    testcase: TestCase,
    mode: RunMode,
) -> StartRunResponse:

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
        testsuite_run_id = None
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
    mode: RunMode,
) -> StartRunResponse:
    testcases = list(testsuite.testcases)
    if not testcases:
        raise HTTPException(status_code=400, detail="Test suite has no test cases")

    suite_job_uid = _generate_uuid()
    testcase_job_uids = [_generate_uuid() for _ in testcases]

    testsuite_run = TestSuiteRun(
        scope=Scope.TESTSUITE,
        mode=mode,
        job_uid=suite_job_uid,
        testsuite_id=testsuite.id,  # type: ignore[arg-type]
    )
    session.add(testsuite_run)
    session.flush()

    testcase_runs = [
        TestCaseRun(
            scope=Scope.TESTSUITE,
            mode=mode,
            job_uid=job_uid,
            testcase_id=testcase.id,  # type: ignore[arg-type]
            testsuite_run_id=testsuite_run.id,
            name=testcase.name,
            base_url=testcase.base_url,
            instruction=testcase.instruction,
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
    )
    workflow.apply_async(task_id=suite_job_uid)  

    return StartRunResponse(
        scope=Scope.TESTSUITE,
        run_id=testsuite_run_id,
        mode=mode_val,
        status=status_val,
        created_at=created_at_val,
    )


def launch_project_run(
    session: Session,
    project: Project,
    mode: RunMode,
) -> StartRunResponse:
    project_id = project.id
    testsuites = list(project.testsuites)
    if not testsuites:
        raise HTTPException(status_code=400, detail="Project has no test suites")

    project_job_uid = _generate_uuid()
    project_run = ProjectRun(
        mode=mode,
        status=RunStatus.RUNNING,
        job_uid=project_job_uid,
        project_id=project_id,  # type: ignore[arg-type]
    )
    session.add(project_run)
    session.flush()
    project_run_id = cast(int, project_run.id)

    stream_key = get_stream_key(Scope.PROJECT, project_run_id)

    all_testcase_runs: list[TestCaseRun] = []
    # Holds per-suite data needed to build workflows after the batch flush
    suite_meta: list[tuple[TestSuiteRun, list[int], list[str]]] = []  # (run, tc_indices, tc_job_uids)

    testsuite_workflows = []
    for testsuite in testsuites:
        testcases = list(testsuite.testcases)
        if not testcases:
            continue

        testsuite_job_uid = _generate_uuid()
        testsuite_run = TestSuiteRun(
            scope=Scope.PROJECT,
            mode=mode,
            job_uid=testsuite_job_uid,
            testsuite_id=testsuite.id,  # type: ignore[arg-type]
            project_run_id=project_run_id,
        )
        session.add(testsuite_run)

        testcase_job_uids = [_generate_uuid() for _ in testcases]
        start_idx = len(all_testcase_runs)
        for testcase, job_uid in zip(testcases, testcase_job_uids):
            all_testcase_runs.append(TestCaseRun(
                scope=Scope.PROJECT,
                mode=mode,
                status=RunStatus.QUEUED,
                job_uid=job_uid,
                testcase_id=testcase.id,  # type: ignore[arg-type]
                testsuite_run_id=None,  # filled after suite flush below
                name=testcase.name,
                base_url=testcase.base_url,
                instruction=testcase.instruction,
            ))
        suite_meta.append((testsuite_run, list(range(start_idx, len(all_testcase_runs))), testcase_job_uids))

    if not suite_meta:
        raise HTTPException(status_code=400, detail="Project has no executable test cases")

    # Single flush to get all testsuite_run IDs
    session.flush()

    # Patch testsuite_run_id now that IDs are available, then bulk-add testcase runs
    for testsuite_run, tc_indices, _ in suite_meta:
        for idx in tc_indices:
            all_testcase_runs[idx].testsuite_run_id = testsuite_run.id

    session.add_all(all_testcase_runs)
    session.flush()  # single flush for all testcase runs

    # Build workflow signatures now that all IDs are populated
    for testsuite_run, tc_indices, testcase_job_uids in suite_meta:
        workflow = _build_testsuite_workflow_signature(
            testcase_runs_ids=[cast(int, all_testcase_runs[i].id) for i in tc_indices],
            testcase_job_uids=testcase_job_uids,
            testsuite_run_id=cast(int, testsuite_run.id),
            stream_key=stream_key,
            abort_id=project_run_id,
            stream_steps=True,
        )
        testsuite_workflows.append(workflow)

    mode_val = project_run.mode
    status_val = project_run.status
    created_at_val = project_run.created_at

    session.commit()

    workflow = _build_project_workflow_signature(
        testsuite_workflows=testsuite_workflows,
        project_run_id=project_run_id,
        stream_key=stream_key,
    )
    workflow.apply_async(task_id=project_job_uid)

    return StartRunResponse(
        scope=Scope.PROJECT.value,
        run_id=project_run_id,
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


async def abort_project_run(
    project_run: ProjectRun
) :
    await abort_async(cast(int, project_run.id))


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