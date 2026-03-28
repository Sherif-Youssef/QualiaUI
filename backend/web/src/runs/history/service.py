from fastapi import HTTPException
from sqlmodel import Session

from src.auth.models import User
from src.base.schemas import Page, PaginationParams
from src.projects.models import Role as ProjectRole
from src.projects.queries import get_with_link
from src.projects.service import check_project_role

from ..models import TestCaseRun, TestRun, TestStepRun
from .queries import (
    count_testcaseruns,
    count_testruns,
    count_teststepruns,
    delete_testrun as query_delete_testrun,
    get_all_testcaseruns,
    get_all_testruns,
    get_all_teststepruns,
    get_testcaserun_by_id,
    get_testrun_by_run_uid,
    get_teststeprun_by_id,
)
from .schemas import TestCaseRunRead, TestRunRead, TestStepRunRead


# Helpers


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
    run_uid: str,
    role: ProjectRole,
) -> TestRun:
    _require_project_access(session, user, project_id, role)

    testrun = get_testrun_by_run_uid(session, project_id, run_uid)
    if not testrun:
        raise HTTPException(status_code=404, detail="Test run not found")

    return testrun


# TestRun


def get_testrun(
    session: Session,
    user: User,
    project_id: int,
    run_uid: str,
) -> TestRunRead:
    testrun = _require_testrun(session, user, project_id, run_uid, ProjectRole.VIEWER)
    return TestRunRead.model_validate(testrun, from_attributes=True)


def list_testruns(
    session: Session,
    user: User,
    project_id: int,
    pagination_params: PaginationParams,
) -> Page[TestRunRead]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    testruns = get_all_testruns(session, project_id, pagination_params)
    total_items = count_testruns(session, project_id)

    return Page(
        items=[TestRunRead.model_validate(tr, from_attributes=True) for tr in testruns],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )


def remove_testrun(
    session: Session,
    user: User,
    project_id: int,
    run_uid: str,
) -> None:
    testrun = _require_testrun(session, user, project_id, run_uid, ProjectRole.ADMIN)
    query_delete_testrun(session, testrun)
    session.commit()


# TestCaseRun


def get_testcaserun(
    session: Session,
    user: User,
    project_id: int,
    run_uid: str,
    testcaserun_id: int,
) -> TestCaseRunRead:
    _require_testrun(session, user, project_id, run_uid, ProjectRole.VIEWER)

    testcaserun = get_testcaserun_by_id(session, run_uid, testcaserun_id)
    if not testcaserun:
        raise HTTPException(status_code=404, detail="Test case run not found")

    return TestCaseRunRead.model_validate(testcaserun, from_attributes=True)


def list_testcaseruns(
    session: Session,
    user: User,
    project_id: int,
    run_uid: str,
    pagination_params: PaginationParams,
) -> Page[TestCaseRunRead]:
    _require_testrun(session, user, project_id, run_uid, ProjectRole.VIEWER)

    testcaseruns = get_all_testcaseruns(session, run_uid, pagination_params)
    total_items = count_testcaseruns(session, run_uid)

    return Page(
        items=[TestCaseRunRead.model_validate(tcr, from_attributes=True) for tcr in testcaseruns],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )


# TestStepRun


def get_teststeprun(
    session: Session,
    user: User,
    project_id: int,
    run_uid: str,
    testcaserun_id: int,
    teststeprun_id: int,
) -> TestStepRunRead:
    _require_testrun(session, user, project_id, run_uid, ProjectRole.VIEWER)

    teststeprun = get_teststeprun_by_id(session, run_uid, testcaserun_id, teststeprun_id)
    if not teststeprun:
        raise HTTPException(status_code=404, detail="Test step run not found")

    return TestStepRunRead.model_validate(teststeprun, from_attributes=True)


def list_teststepruns(
    session: Session,
    user: User,
    project_id: int,
    run_uid: str,
    testcaserun_id: int,
    pagination_params: PaginationParams,
) -> Page[TestStepRunRead]:
    _require_testrun(session, user, project_id, run_uid, ProjectRole.VIEWER)

    testcaserun = get_testcaserun_by_id(session, run_uid, testcaserun_id)
    if not testcaserun:
        raise HTTPException(status_code=404, detail="Test case run not found")

    teststeps = get_all_teststepruns(session, run_uid, testcaserun_id, pagination_params)
    total_items = count_teststepruns(session, run_uid, testcaserun_id)

    return Page(
        items=[TestStepRunRead.model_validate(ts, from_attributes=True) for ts in teststeps],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )
