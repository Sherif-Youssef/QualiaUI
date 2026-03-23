from fastapi import HTTPException
from sqlmodel import Session

from src.auth.models import User
from src.base.schemas import Page, PaginationParams
from src.projects.models import Role as ProjectRole
from src.projects.queries import get_with_link
from src.projects.service import check_project_role

from .models import TestSuite
from .queries import count, delete, get_all, get_by_id
from .schemas import TestSuiteCreate, TestSuiteRead, TestSuiteUpdate


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


def get_testsuite(session: Session, user: User, project_id: int, testsuite_id: int) -> TestSuite:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    testsuite = get_by_id(session, project_id, testsuite_id)
    if not testsuite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    return testsuite


def list_testsuites(
    session: Session,
    user: User,
    project_id: int,
    pagination_params: PaginationParams,
) -> Page[TestSuiteRead]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)

    testsuites = get_all(session, project_id, pagination_params)
    total_items = count(session, project_id)

    return Page(
        items=[
            TestSuiteRead(
                id=testsuite.id,  # type: ignore[arg-type]
                project_id=testsuite.project_id,
                name=testsuite.name,
                description=testsuite.description,
            )
            for testsuite in testsuites
        ],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )


def create_testsuite(
    session: Session,
    user: User,
    project_id: int,
    testsuite_create: TestSuiteCreate,
) -> TestSuite:
    _require_project_access(session, user, project_id, ProjectRole.EDITOR)

    testsuite = TestSuite(
        project_id=project_id,
        name=testsuite_create.name,
        description=testsuite_create.description,
    )
    session.add(testsuite)
    session.commit()
    session.refresh(testsuite)

    return testsuite


def update_testsuite(
    session: Session,
    user: User,
    project_id: int,
    testsuite_id: int,
    testsuite_update: TestSuiteUpdate,
) -> TestSuite:
    _require_project_access(session, user, project_id, ProjectRole.EDITOR)

    testsuite = get_by_id(session, project_id, testsuite_id)
    if not testsuite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    if testsuite_update.name is not None:
        testsuite.name = testsuite_update.name
    if testsuite_update.description is not None:
        testsuite.description = testsuite_update.description

    session.add(testsuite)
    session.commit()
    session.refresh(testsuite)

    return testsuite


def delete_testsuite(session: Session, user: User, project_id: int, testsuite_id: int) -> None:
    _require_project_access(session, user, project_id, ProjectRole.ADMIN)

    testsuite = get_by_id(session, project_id, testsuite_id)
    if not testsuite:
        raise HTTPException(status_code=404, detail="Test suite not found")

    delete(session, testsuite)
    session.commit()
