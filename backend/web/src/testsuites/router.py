from fastapi import APIRouter, Depends, status, Query

from src.auth.dependencies import UserDep
from src.base.schemas import Page, PaginationParams, Cookie as CookieSchema
from src.database import SessionDep
from src.testsuites.dependencies import ViewerTestSuiteDep, EditorTestSuiteDep, AdminTestSuiteDep, TestSuiteCookieDep
from src.projects.dependencies import ViewerProjectDep, EditorProjectDep

from .schemas import TestSuiteCreate, TestSuiteRead, TestSuiteUpdate
from .service import (
	create_testsuite,
	delete_testsuite,
	list_testsuites,
	update_testsuite,
	list_testsuite_runs,
	add_cookie_to_testsuite,
	update_testsuite_cookie,
	delete_testsuite_cookie,
)
from src.runs.schemas import TestSuiteRunRead


router = APIRouter(prefix="/projects/{project_id}/testsuites", tags=["testsuites"])


@router.get("", response_model=Page[TestSuiteRead])
async def list_testsuites_route(
	session: SessionDep,
	project: ViewerProjectDep,
	pagination_params: PaginationParams = Depends(),
	name: str | None = Query(None),
):
	return list_testsuites(
		session=session,
		project_id=project.id, # type: ignore[arg-type]
		pagination_params=pagination_params,
		name=name,
	)


@router.get("/{testsuite_id}", response_model=TestSuiteRead)
async def get_testsuite_route(
	testsuite: ViewerTestSuiteDep,
):
	return testsuite

@router.get("/{testsuite_id}/runs", response_model=Page[TestSuiteRunRead])
async def list_testsuite_runs_route(
	session: SessionDep,
	testsuite: ViewerTestSuiteDep,
	pagination_params: PaginationParams = Depends(),
):
	return list_testsuite_runs(
		session=session,
		testsuite_id=testsuite.id, # type: ignore[arg-type]
		pagination_params=pagination_params,
	)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TestSuiteRead)
async def create_testsuite_route(
	session: SessionDep,
	project: EditorProjectDep,
	testsuite_create: TestSuiteCreate,
):
	return create_testsuite(
		session=session,
		project_id=project.id, # type: ignore[arg-type]
		testsuite_create=testsuite_create,
	)


@router.put("/{testsuite_id}", response_model=TestSuiteRead)
async def update_testsuite_route(
	session: SessionDep,
	testsuite: EditorTestSuiteDep,
	testsuite_update: TestSuiteUpdate,
):
	return update_testsuite(
		session=session,
		testsuite=testsuite,
		testsuite_update=testsuite_update,
	)


@router.post("/{testsuite_id}/cookies", status_code=status.HTTP_201_CREATED, response_model=CookieSchema)
async def add_cookie_to_testsuite_route(
	session: SessionDep,
	testsuite: EditorTestSuiteDep,
	cookie_create: CookieSchema,
):
	return add_cookie_to_testsuite(
		session=session,
		testsuite=testsuite,
		cookie_create=cookie_create,
	)


@router.put("/{testsuite_id}/cookies/{cookie_id}", response_model=CookieSchema)
async def update_testsuite_cookie_route(
	session: SessionDep,
	cookie: TestSuiteCookieDep,
	cookie_update: CookieSchema,
):
	return update_testsuite_cookie(
		session=session,
		cookie=cookie,
		cookie_update=cookie_update,
	)


@router.delete("/{testsuite_id}/cookies/{cookie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testsuite_cookie_route(
	session: SessionDep,
	cookie: TestSuiteCookieDep,
):
	delete_testsuite_cookie(session=session, cookie=cookie)


@router.delete("/{testsuite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testsuite_route(
	session: SessionDep,
	testsuite: AdminTestSuiteDep,
):
	delete_testsuite(
		session=session,
		testsuite=testsuite,
	)
