from fastapi import APIRouter, Depends, status

from src.auth.dependencies import UserDep
from src.base.schemas import Page, PaginationParams
from src.database import SessionDep
from src.testsuites.dependencies import ViewerTestSuiteDep, EditorTestSuiteDep, AdminTestSuiteDep
from src.projects.dependencies import ViewerProjectDep, EditorProjectDep

from .schemas import TestSuiteCreate, TestSuiteRead, TestSuiteUpdate
from .service import (
	create_testsuite,
	delete_testsuite,
	list_testsuites,
	update_testsuite,
)


router = APIRouter(prefix="/projects/{project_id}/testsuites", tags=["testsuites"])


@router.get("", response_model=Page[TestSuiteRead])
async def list_testsuites_route(
	session: SessionDep,
	project: ViewerProjectDep,
	pagination_params: PaginationParams = Depends(),
):
	return list_testsuites(
		session=session,
		project_id=project.id, # type: ignore[arg-type]
		pagination_params=pagination_params,
	)


@router.get("/{testsuite_id}", response_model=TestSuiteRead)
async def get_testsuite_route(
	testsuite: ViewerTestSuiteDep,
):
	return testsuite


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


@router.delete("/{testsuite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testsuite_route(
	session: SessionDep,
	testsuite: AdminTestSuiteDep,
):
	delete_testsuite(
		session=session,
		testsuite=testsuite,
	)
