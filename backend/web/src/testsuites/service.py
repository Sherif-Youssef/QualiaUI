from sqlmodel import Session

from src.base.schemas import Page, PaginationParams
from src.runs.schemas import TestSuiteRunRead
from src.runs.queries import (
    get_all_testsuite_runs_by_testsuite_id as get_runs_all,
    count_testsuite_runs_by_testsuite_id as count_runs,
)
from src.projects.models import Project

from .models import TestSuite
from .queries import count, delete, get_all
from .schemas import TestSuiteCreate, TestSuiteRead, TestSuiteUpdate
from src.base.models import Cookie as CookieModel
from src.base.schemas import Cookie as CookieSchema


def list_testsuites(
    session: Session,
    project_id: int,
    pagination_params: PaginationParams,
    name: str | None = None,
) -> Page[TestSuiteRead]:
    testsuites = get_all(session, project_id, pagination_params, name=name)
    total_items = count(session, project_id, name=name)

    return Page(
        items=[
            TestSuiteRead.model_validate(testsuite, from_attributes=True)
            for testsuite in testsuites
        ],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )


def list_testsuite_runs(
    session: Session,
    testsuite_id: int,
    pagination_params: PaginationParams,
) -> Page[TestSuiteRunRead]:
    runs = get_runs_all(session, testsuite_id, pagination_params)
    total_items = count_runs(session, testsuite_id)

    return Page(
        items=[
            TestSuiteRunRead.model_validate(run, from_attributes=True)
            for run in runs
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


def add_cookie_to_testsuite(
    session: Session,
    testsuite: TestSuite,
    cookie_create: CookieSchema,
) -> CookieModel:
    cookie = CookieModel(
        **cookie_create.model_dump(),
        testsuite_id=testsuite.id,
    )
    session.add(cookie)
    session.commit()
    session.refresh(cookie)

    return cookie


def update_testsuite_cookie(
    session: Session,
    cookie: CookieModel,
    cookie_update: CookieSchema,
) -> CookieModel:
    for key, value in cookie_update.model_dump(exclude_unset=True).items():
        setattr(cookie, key, value)
    
    session.add(cookie)
    session.commit()
    session.refresh(cookie)
    return cookie


def delete_testsuite_cookie(
    session: Session,
    cookie: CookieModel,
) -> None:
    session.delete(cookie)
    session.commit()


def delete_testsuite(session: Session, testsuite: TestSuite) -> None:
    delete(session, testsuite)
    session.commit()
