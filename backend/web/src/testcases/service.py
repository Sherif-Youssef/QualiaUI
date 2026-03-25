from fastapi import HTTPException
from sqlmodel import Session

from src.auth.models import User
from src.base.schemas import Page, PaginationParams
from src.projects.models import Role as ProjectRole
from src.projects.queries import get_with_link
from src.projects.service import check_project_role
from src.testsuites.queries import get_by_id as get_testsuite_by_id

from .models import TestCase
from .queries import count, delete, get_all, get_by_id
from .schemas import TestCaseCreate, TestCaseRead, TestCaseUpdate


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


def _require_testsuite_access(
	session: Session,
	user: User,
	project_id: int,
	testsuite_id: int,
	role: ProjectRole,
) -> None:
	"""Check project access and verify testsuite belongs to the project."""
	_require_project_access(session, user, project_id, role)
	
	testsuite = get_testsuite_by_id(session, project_id, testsuite_id)
	if not testsuite:
		raise HTTPException(status_code=404, detail="Test suite not found")


def get_testcase(
	session: Session,
	user: User,
	project_id: int,
	testsuite_id: int,
	testcase_id: int,
) -> TestCase:
	_require_testsuite_access(session, user, project_id, testsuite_id, ProjectRole.VIEWER)

	testcase = get_by_id(session, testsuite_id, testcase_id)
	if not testcase:
		raise HTTPException(status_code=404, detail="Test case not found")

	return testcase


def list_testcases(
	session: Session,
	user: User,
	project_id: int,
	testsuite_id: int,
	pagination_params: PaginationParams,
) -> Page[TestCaseRead]:
	_require_testsuite_access(session, user, project_id, testsuite_id, ProjectRole.VIEWER)

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
	user: User,
	project_id: int,
	testsuite_id: int,
	testcase_create: TestCaseCreate,
) -> TestCase:
	_require_testsuite_access(session, user, project_id, testsuite_id, ProjectRole.EDITOR)

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
	user: User,
	project_id: int,
	testsuite_id: int,
	testcase_id: int,
	testcase_update: TestCaseUpdate,
) -> TestCase:
	_require_testsuite_access(session, user, project_id, testsuite_id, ProjectRole.EDITOR)

	testcase = get_by_id(session, testsuite_id, testcase_id)
	if not testcase:
		raise HTTPException(status_code=404, detail="Test case not found")

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


def delete_testcase(
	session: Session,
	user: User,
	project_id: int,
	testsuite_id: int,
	testcase_id: int,
) -> None:
	_require_testsuite_access(session, user, project_id, testsuite_id, ProjectRole.ADMIN)

	testcase = get_by_id(session, testsuite_id, testcase_id)
	if not testcase:
		raise HTTPException(status_code=404, detail="Test case not found")

	delete(session, testcase)
	session.commit()
