from sqlmodel import Session

from src.base.schemas import Page, PaginationParams
from src.runs.schemas import TestCaseRunRead
from src.runs.queries import (
	get_all_testcase_runs_by_testcase_id as get_runs_all,
	count_testcase_runs_by_testcase_id as count_runs,
)

from .models import TestCase
from .queries import count, delete, get_all, get_by_id
from .schemas import TestCaseCreate, TestCaseRead, TestCaseUpdate
from src.base.models import Cookie as CookieModel
from src.base.schemas import Cookie as CookieSchema


def list_testcases(
	session: Session,
	testsuite_id: int,
	pagination_params: PaginationParams,
	name: str | None = None,
) -> Page[TestCaseRead]:
	testcases = get_all(session, testsuite_id, pagination_params, name=name)
	total_items = count(session, testsuite_id, name=name)

	return Page(
		items=[
			TestCaseRead.model_validate(testcase, from_attributes=True)
			for testcase in testcases
		],
		offset=pagination_params.offset,
		limit=pagination_params.limit,
		total_items=total_items,
	)


def list_testcase_runs(
	session: Session,
	testcase_id: int,
	pagination_params: PaginationParams,
) -> Page[TestCaseRunRead]:
	runs = get_runs_all(session, testcase_id, pagination_params)
	total_items = count_runs(session, testcase_id)

	return Page(
		items=[
			TestCaseRunRead.model_validate(run, from_attributes=True)
			for run in runs
		],
		offset=pagination_params.offset,
		limit=pagination_params.limit,
		total_items=total_items,
	)


def create_testcase(
	session: Session,
	testsuite_id: int,
	testcase_create: TestCaseCreate,
) -> TestCase:
	testcase = TestCase(
		testsuite_id=testsuite_id,
		name=testcase_create.name,
		description=testcase_create.description,
		base_url=testcase_create.base_url,
		instruction=testcase_create.instruction,
	)
	session.add(testcase)
	session.commit()
	session.refresh(testcase)

	return testcase


def update_testcase(
	session: Session,
	testcase: TestCase,
	testcase_update: TestCaseUpdate,
) -> TestCase:
	if testcase_update.name is not None:
		testcase.name = testcase_update.name
	if testcase_update.description is not None:
		testcase.description = testcase_update.description
	if testcase_update.base_url is not None:
		testcase.base_url = testcase_update.base_url
	if testcase_update.instruction is not None:
		testcase.instruction = testcase_update.instruction

	session.add(testcase)
	session.commit()
	session.refresh(testcase)

	return testcase


def add_cookie_to_testcase(
	session: Session,
	testcase: TestCase,
	cookie_create: CookieSchema,
) -> CookieModel:
	cookie = CookieModel(
		**cookie_create.model_dump(),
		testcase_id=testcase.id,
	)
	session.add(cookie)
	session.commit()
	session.refresh(cookie)

	return cookie


def update_testcase_cookie(
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


def delete_testcase_cookie(
	session: Session,
	cookie: CookieModel,
) -> None:
	session.delete(cookie)
	session.commit()


def delete_testcase(session: Session, testcase: TestCase) -> None:
	delete(session, testcase)
	session.commit()
