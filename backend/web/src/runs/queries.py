from sqlalchemy import func
from sqlmodel import Session, and_, col, select

from src.base.schemas import PaginationParams
from src.projects.models import Project, UserProjectLink
from src.testsuites.models import TestSuite
from src.testcases.models import TestCase

from .models import ProjectRun, TestCaseRun, TestSuiteRun


def get_project_run_by_id_with_user_link(
    session: Session,
    project_run_id: int,
    user_id: int,
) -> tuple[ProjectRun, UserProjectLink | None] | None:
    statement = (
        select(ProjectRun, UserProjectLink)
        .join(Project, col(ProjectRun.project_id) == col(Project.id))
        .outerjoin(
            UserProjectLink,
            and_(
                col(UserProjectLink.project_id) == col(Project.id),
                col(UserProjectLink.user_id) == user_id,
            ),
        )
        .where(col(ProjectRun.id) == project_run_id)
    )

    result = session.exec(statement)
    row = result.first()

    if row is None:
        return None

    project_run, user_project_link = row
    return project_run, user_project_link


def get_testsuite_run_by_id_with_user_link(
    session: Session,
    testsuite_run_id: int,
    user_id: int,
) -> tuple[TestSuiteRun, UserProjectLink | None] | None:
    statement = (
        select(TestSuiteRun, UserProjectLink)
        .join(TestSuite, col(TestSuiteRun.testsuite_id) == col(TestSuite.id))
        .join(Project, col(TestSuite.project_id) == col(Project.id))
        .outerjoin(
            UserProjectLink,
            and_(
                col(UserProjectLink.project_id) == col(Project.id),
                col(UserProjectLink.user_id) == user_id,
            ),
        )
        .where(col(TestSuiteRun.id) == testsuite_run_id)
    )

    result = session.exec(statement)
    row = result.first()

    if row is None:
        return None

    testsuite_run, user_project_link = row
    return testsuite_run, user_project_link

def get_testcase_run_by_id_with_user_link(
    session: Session,
    testcase_run_id: int,
    user_id: int,
) -> tuple[TestCaseRun, UserProjectLink | None] | None:
    statement = (
        select(TestCaseRun, UserProjectLink)
        .join(TestCase, col(TestCaseRun.testcase_id) == col(TestCase.id))
        .join(TestSuite, col(TestCase.testsuite_id) == col(TestSuite.id))
        .join(Project, col(TestSuite.project_id) == col(Project.id))
        .outerjoin(
            UserProjectLink,
            and_(
                col(UserProjectLink.project_id) == col(Project.id),
                col(UserProjectLink.user_id) == user_id,
            ),
        )
        .where(col(TestCaseRun.id) == testcase_run_id)
    )

    result = session.exec(statement)
    row = result.first()

    if row is None:
        return None

    testcase_run, user_project_link = row
    return testcase_run, user_project_link


def get_all_testcase_runs_by_testcase_id(
    session: Session,
    testcase_id: int,
    pagination_params: PaginationParams,
) -> list[TestCaseRun]:
    statement = (
        select(TestCaseRun)
        .where(TestCaseRun.testcase_id == testcase_id)
        .order_by(col(TestCaseRun.id).desc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_testcase_runs_by_testcase_id(session: Session, testcase_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(TestCaseRun)
        .where(TestCaseRun.testcase_id == testcase_id)
    )
    return session.exec(statement).one()  # type: ignore[arg-type]


def get_all_testsuite_runs_by_testsuite_id(
    session: Session,
    testsuite_id: int,
    pagination_params: PaginationParams,
) -> list[TestSuiteRun]:
    statement = (
        select(TestSuiteRun)
        .where(TestSuiteRun.testsuite_id == testsuite_id)
        .order_by(col(TestSuiteRun.id).desc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_testsuite_runs_by_testsuite_id(session: Session, testsuite_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(TestSuiteRun)
        .where(TestSuiteRun.testsuite_id == testsuite_id)
    )
    return session.exec(statement).one()  # type: ignore[arg-type]


def get_all_project_runs_by_project_id(
    session: Session,
    project_id: int,
    pagination_params: PaginationParams,
) -> list[ProjectRun]:
    statement = (
        select(ProjectRun)
        .where(ProjectRun.project_id == project_id)
        .order_by(col(ProjectRun.id).desc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_project_runs_by_project_id(session: Session, project_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(ProjectRun)
        .where(ProjectRun.project_id == project_id)
    )
    return session.exec(statement).one()  # type: ignore[arg-type]