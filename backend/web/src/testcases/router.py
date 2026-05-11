from fastapi import APIRouter, Depends, status, Query

from src.base.schemas import Page, PaginationParams, Cookie as CookieSchema
from src.database import SessionDep
from src.testsuites.dependencies import (
	ViewerTestSuiteDep,
	EditorTestSuiteDep,
)
from src.testcases.dependencies import (
	ViewerTestCaseDep,
	EditorTestCaseDep,
	AdminTestCaseDep,
	TestCaseCookieDep,
)

from .schemas import TestCaseCreate, TestCaseRead, TestCaseUpdate
from .service import (
	create_testcase,
	delete_testcase,
	list_testcases,
	update_testcase,
	list_testcase_runs,
	add_cookie_to_testcase,
	update_testcase_cookie,
	delete_testcase_cookie,
)
from src.runs.schemas import TestCaseRunRead

router = APIRouter(prefix="/projects/{project_id}/testsuites/{testsuite_id}/testcases", tags=["testcases"])


@router.get("/{testcase_id}", response_model=TestCaseRead)
async def get_testcase_route(
	testcase: ViewerTestCaseDep,
):
	return testcase

@router.get("", response_model=Page[TestCaseRead])
async def list_testcases_route(
	session: SessionDep,
	testsuite: ViewerTestSuiteDep,
	pagination_params: PaginationParams = Depends(),
	name: str | None = Query(None),
):
	return list_testcases(
		session=session,
		testsuite_id=testsuite.id,  # type: ignore[arg-type]
		pagination_params=pagination_params,
		name=name,
	)

@router.get("/{testcase_id}/runs", response_model=Page[TestCaseRunRead])
async def list_testcase_runs_route(
	session: SessionDep,
	testcase: ViewerTestCaseDep,
	pagination_params: PaginationParams = Depends(),
):
	return list_testcase_runs(
		session=session,
		testcase_id=testcase.id,  # type: ignore[arg-type]
		pagination_params=pagination_params,
	)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TestCaseRead)
async def create_testcase_route(
	session: SessionDep,
	testsuite: EditorTestSuiteDep,
	testcase_create: TestCaseCreate,
):
	return create_testcase(
		session=session,
		testsuite_id=testsuite.id,  # type: ignore[arg-type]
		testcase_create=testcase_create,
	)


@router.put("/{testcase_id}", response_model=TestCaseRead)
async def update_testcase_route(
	session: SessionDep,
	testcase: EditorTestCaseDep,
	testcase_update: TestCaseUpdate,
):
	return update_testcase(
		session=session,
		testcase=testcase,
		testcase_update=testcase_update,
	)


@router.post("/{testcase_id}/cookies", status_code=status.HTTP_201_CREATED, response_model=CookieSchema)
async def add_cookie_to_testcase_route(
	session: SessionDep,
	testcase: EditorTestCaseDep,
	cookie_create: CookieSchema,
):
	return add_cookie_to_testcase(
		session=session,
		testcase=testcase,
		cookie_create=cookie_create,
	)


@router.put("/{testcase_id}/cookies/{cookie_id}", response_model=CookieSchema)
async def update_testcase_cookie_route(
	session: SessionDep,
	cookie: TestCaseCookieDep,
	cookie_update: CookieSchema,
):
	return update_testcase_cookie(
		session=session,
		cookie=cookie,
		cookie_update=cookie_update,
	)


@router.delete("/{testcase_id}/cookies/{cookie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testcase_cookie_route(
	session: SessionDep,
	cookie: TestCaseCookieDep,
):
	delete_testcase_cookie(session=session, cookie=cookie)


@router.delete("/{testcase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testcase_route(
	session: SessionDep,
	testcase: AdminTestCaseDep,
):
	delete_testcase(session=session, testcase=testcase)
