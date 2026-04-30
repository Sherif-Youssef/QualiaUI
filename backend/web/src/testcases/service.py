from sqlmodel import Session

from src.base.schemas import Page, PaginationParams

from .models import TestCase
from .queries import count, delete, get_all, get_by_id
from .schemas import TestCaseCreate, TestCaseRead, TestCaseUpdate


def list_testcases(
	session: Session,
	testsuite_id: int,
	pagination_params: PaginationParams,
) -> Page[TestCaseRead]:
	testcases = get_all(session, testsuite_id, pagination_params)
	total_items = count(session, testsuite_id)

	return Page(
		items=[
				TestCaseRead(
				id=testcase.id,  # type: ignore[arg-type]
				testsuite_id=testcase.testsuite_id,  # type: ignore[arg-type]
				name=testcase.name,
				description=testcase.description,
				base_url=testcase.base_url,
				instruction=testcase.instruction,
				executable_steps=testcase.executable_steps,
			)
			for testcase in testcases
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


def delete_testcase(session: Session, testcase: TestCase) -> None:
	delete(session, testcase)
	session.commit()
