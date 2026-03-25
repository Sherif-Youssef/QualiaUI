from fastapi import APIRouter, Depends, status

from src.auth.dependencies import UserDep
from src.base.schemas import Page, PaginationParams
from src.database import SessionDep

from .schemas import TestCaseCreate, TestCaseRead, TestCaseUpdate
from .service import (
	create_testcase,
	delete_testcase,
	get_testcase,
	list_testcases,
	update_testcase,
)


router = APIRouter(prefix="/projects/{project_id}/testsuites/{testsuite_id}/testcases", tags=["testcases"])


@router.get("", response_model=Page[TestCaseRead])
async def list_testcases_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
	testsuite_id: int,
	pagination_params: PaginationParams = Depends(),
):
	return list_testcases(
		session=session,
		user=user,
		project_id=project_id,
		testsuite_id=testsuite_id,
		pagination_params=pagination_params,
	)


@router.get("/{testcase_id}", response_model=TestCaseRead)
async def get_testcase_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
	testsuite_id: int,
	testcase_id: int,
):
	return get_testcase(
		session=session,
		user=user,
		project_id=project_id,
		testsuite_id=testsuite_id,
		testcase_id=testcase_id,
	)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TestCaseRead)
async def create_testcase_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
	testsuite_id: int,
	testcase_create: TestCaseCreate,
):
	return create_testcase(
		session=session,
		user=user,
		project_id=project_id,
		testsuite_id=testsuite_id,
		testcase_create=testcase_create,
	)


@router.put("/{testcase_id}", response_model=TestCaseRead)
async def update_testcase_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
	testsuite_id: int,
	testcase_id: int,
	testcase_update: TestCaseUpdate,
):
	return update_testcase(
		session=session,
		user=user,
		project_id=project_id,
		testsuite_id=testsuite_id,
		testcase_id=testcase_id,
		testcase_update=testcase_update,
	)


@router.delete("/{testcase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testcase_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
	testsuite_id: int,
	testcase_id: int,
):
	delete_testcase(
		session=session,
		user=user,
		project_id=project_id,
		testsuite_id=testsuite_id,
		testcase_id=testcase_id,
	)
