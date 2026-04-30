from sqlmodel import Session

from src.base.schemas import Page, PaginationParams
from src.projects.models import Project

from .models import TestSuite
from .queries import count, delete, get_all
from .schemas import TestSuiteCreate, TestSuiteRead, TestSuiteUpdate


def list_testsuites(
    session: Session,
    project_id: int,
    pagination_params: PaginationParams,
) -> Page[TestSuiteRead]:
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
    project_id: int,
    testsuite_create: TestSuiteCreate,
) -> TestSuite:
    
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
    testsuite: TestSuite,
    testsuite_update: TestSuiteUpdate,
) -> TestSuite:

    if testsuite_update.name is not None:
        testsuite.name = testsuite_update.name
    if testsuite_update.description is not None:
        testsuite.description = testsuite_update.description

    session.add(testsuite)
    session.commit()
    session.refresh(testsuite)

    return testsuite


def delete_testsuite(session: Session, testsuite: TestSuite) -> None:
    delete(session, testsuite)
    session.commit()
