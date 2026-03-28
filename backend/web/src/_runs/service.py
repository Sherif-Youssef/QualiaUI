# service.py

import base64
import logging

from fastapi import HTTPException
from sqlmodel import Session

from src.auth.models import User
from src.base.schemas import Page, PaginationParams
from src.projects.models import Role as ProjectRole
from src.projects.queries import get_with_link
from src.projects.service import check_project_role

from automation_engine.testing.history import (
    TestStep as EngineTestStep,
    TestTermination,
    TestStepGroup as EngineTestStepGroup,
)

from .models import TestRun, TestCaseRun, TestStepRun
from .queries import (
    get_testrun_by_id, get_all_testruns, count_testruns, delete_testrun,
    get_testcaserun_by_id, get_all_testcaseruns, count_testcaseruns,
    get_teststeprun_by_id, get_all_teststepruns, count_teststepruns,
)
from .schemas import (
    TestRunRead, TestCaseRunRead, TestStepRunRead,
    ActiveRunInfo, ActiveRunDetail, ActiveRunStepRead, ActiveRunCaseRead,
)
from .manager import RunManager, ActiveRun


logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Access helpers
# ──────────────────────────────────────────────

def _require_project_access(
    session: Session,
    user: User,
    project_id: int,
    role: ProjectRole,
) -> None:
    project_with_link = get_with_link(session, project_id, user.id)  # type: ignore[arg-type]
    if not project_with_link:
        raise HTTPException(status_code=404, detail="Project not found")

    _, user_project_link = project_with_link
    check_project_role(user, user_project_link, role)


def _require_testrun(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
) -> TestRun:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    testrun = get_testrun_by_id(session, project_id, testrun_id)
    if not testrun:
        raise HTTPException(status_code=404, detail="Test run not found")
    return testrun


def _require_testcaserun(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
    testcaserun_id: int,
) -> tuple[TestRun, TestCaseRun]:
    testrun = _require_testrun(session, user, project_id, testrun_id)

    testcaserun = get_testcaserun_by_id(session, testrun_id, testcaserun_id)
    if not testcaserun:
        raise HTTPException(status_code=404, detail="Test case run not found")
    return testrun, testcaserun


# ──────────────────────────────────────────────
# Active-run serialization helpers
# ──────────────────────────────────────────────

def _serialize_engine_step(step: EngineTestStep) -> ActiveRunStepRead:
    return ActiveRunStepRead(
        index=step.index,
        status=step.status.value if step.status else None,
        error_message=step.error_message,
        started_at=step.started_at,
        finished_at=step.finished_at,
        executable=step.executable.model_dump() if step.executable else None,
        screenshot_before=(
            base64.b64encode(step.snapshot_before.screenshot).decode()
            if step.snapshot_before and step.snapshot_before.screenshot
            else None
        ),
        screenshot_after=(
            base64.b64encode(step.snapshot_after.screenshot).decode()
            if step.snapshot_after and step.snapshot_after.screenshot
            else None
        ),
    )


def _serialize_engine_group(group: EngineTestStepGroup) -> ActiveRunCaseRead:
    return ActiveRunCaseRead(
        index=group.index,
        instruction=group.instruction,
        status=group.status.value,
        started_at=group.started_at,
        finished_at=group.finished_at,
        is_finalized=group.is_finalized,
        abort_reason=group.abort_reason,
        steps=[_serialize_engine_step(s) for s in group.steps],
    )


# ──────────────────────────────────────────────
# TestRun — completed (DB)
# ──────────────────────────────────────────────

def get_testrun_detail(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
) -> TestRunRead:
    testrun = _require_testrun(session, user, project_id, testrun_id)

    return TestRunRead(
        id=testrun.id,  # type: ignore[arg-type]
        project_id=testrun.project_id,  # type: ignore[arg-type]
        name=testrun.name,
        description=testrun.description,
        mode=testrun.mode,
        started_at=testrun.started_at,
        finished_at=testrun.finished_at,
        status=testrun.status,
    )


def list_testruns(
    session: Session,
    user: User,
    project_id: int,
    pagination_params: PaginationParams,
) -> Page[TestRunRead]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    testruns = get_all_testruns(session, project_id, pagination_params)
    total = count_testruns(session, project_id)

    return Page(
        items=[
            TestRunRead(
                id=tr.id,  # type: ignore[arg-type]
                project_id=tr.project_id,  # type: ignore[arg-type]
                name=tr.name,
                description=tr.description,
                mode=tr.mode,
                started_at=tr.started_at,
                finished_at=tr.finished_at,
                status=tr.status,
            )
            for tr in testruns
        ],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total,
    )


def delete_testrun_service(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
) -> None:
    _require_project_access(session, user, project_id, ProjectRole.ADMIN)

    testrun = get_testrun_by_id(session, project_id, testrun_id)
    if not testrun:
        raise HTTPException(status_code=404, detail="Test run not found")

    delete_testrun(session, testrun)
    session.commit()


# ──────────────────────────────────────────────
# TestCaseRun — completed (DB)
# ──────────────────────────────────────────────

def get_testcaserun_detail(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
    testcaserun_id: int,
) -> TestCaseRunRead:
    _, testcaserun = _require_testcaserun(
        session, user, project_id, testrun_id, testcaserun_id,
    )

    return TestCaseRunRead(
        id=testcaserun.id,  # type: ignore[arg-type]
        testrun_id=testcaserun.testrun_id,  # type: ignore[arg-type]
        name=testcaserun.name,
        description=testcaserun.description,
        instruction=testcaserun.instruction,
        started_at=testcaserun.started_at,
        finished_at=testcaserun.finished_at,
        status=testcaserun.status,
        termination_reason=testcaserun.termination_reason,
    )


def list_testcaseruns(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
    pagination_params: PaginationParams,
) -> Page[TestCaseRunRead]:
    _require_testrun(session, user, project_id, testrun_id)

    cases = get_all_testcaseruns(session, testrun_id, pagination_params)
    total = count_testcaseruns(session, testrun_id)

    return Page(
        items=[
            TestCaseRunRead(
                id=c.id,  # type: ignore[arg-type]
                testrun_id=c.testrun_id,  # type: ignore[arg-type]
                name=c.name,
                description=c.description,
                instruction=c.instruction,
                started_at=c.started_at,
                finished_at=c.finished_at,
                status=c.status,
                termination_reason=c.termination_reason,
            )
            for c in cases
        ],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total,
    )


# ──────────────────────────────────────────────
# TestStepRun — completed (DB)
# ──────────────────────────────────────────────

def get_teststeprun_detail(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
    testcaserun_id: int,
    teststeprun_id: int,
) -> TestStepRunRead:
    _require_testcaserun(session, user, project_id, testrun_id, testcaserun_id)

    step = get_teststeprun_by_id(session, testcaserun_id, teststeprun_id)
    if not step:
        raise HTTPException(status_code=404, detail="Test step run not found")

    return TestStepRunRead(
        id=step.id,  # type: ignore[arg-type]
        testcaserun_id=step.testcaserun_id,  # type: ignore[arg-type]
        executable=step.executable,
        screenshot_before=step.screenshot_before,
        screenshot_after=step.screenshot_after,
        started_at=step.started_at,
        finished_at=step.finished_at,
        status=step.status,
    )


def list_teststepruns(
    session: Session,
    user: User,
    project_id: int,
    testrun_id: int,
    testcaserun_id: int,
    pagination_params: PaginationParams,
) -> Page[TestStepRunRead]:
    _require_testcaserun(session, user, project_id, testrun_id, testcaserun_id)

    steps = get_all_teststepruns(session, testcaserun_id, pagination_params)
    total = count_teststepruns(session, testcaserun_id)

    return Page(
        items=[
            TestStepRunRead(
                id=s.id,  # type: ignore[arg-type]
                testcaserun_id=s.testcaserun_id,  # type: ignore[arg-type]
                executable=s.executable,
                screenshot_before=s.screenshot_before,
                screenshot_after=s.screenshot_after,
                started_at=s.started_at,
                finished_at=s.finished_at,
                status=s.status,
            )
            for s in steps
        ],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total,
    )


# ──────────────────────────────────────────────
# Active runs (in-memory)
# ──────────────────────────────────────────────

def list_active_runs_for_project(
    user: User,
    session: Session,
    project_id: int,
    run_manager: RunManager,
) -> list[ActiveRunInfo]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    results: list[ActiveRunInfo] = []
    for run_id, active in run_manager.active_runs.items():
        if active.project_id != project_id:
            continue
        results.append(
            ActiveRunInfo(
                run_id=active.run_id,
                project_id=active.project_id,
                name=active.name,
                description=active.description,
                mode=active.mode,
                base_url=active.base_url,
            )
        )
    return results


def get_active_run_detail(
    user: User,
    session: Session,
    project_id: int,
    run_id: str,
    run_manager: RunManager,
) -> ActiveRunDetail:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    active = run_manager.get_active_run(run_id)
    if not active or active.project_id != project_id:
        raise HTTPException(status_code=404, detail="Active run not found")

    cases: list[ActiveRunCaseRead] = []
    ts = active.testing_session
    if ts and ts._test_run:
        for group in ts._test_run.groups:
            cases.append(_serialize_engine_group(group))

    return ActiveRunDetail(
        run_id=active.run_id,
        project_id=active.project_id,
        name=active.name,
        description=active.description,
        mode=active.mode,
        base_url=active.base_url,
        cases=cases,
    )


async def abort_active_run(
    user: User,
    session: Session,
    project_id: int,
    run_id: str,
    run_manager: RunManager,
) -> None:
    _require_project_access(session, user, project_id, ProjectRole.EDITOR)

    active = run_manager.get_active_run(run_id)
    if not active or active.project_id != project_id:
        raise HTTPException(status_code=404, detail="Active run not found")

    await run_manager.abort_run(run_id)