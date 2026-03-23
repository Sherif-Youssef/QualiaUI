from fastapi import APIRouter, Depends, status

from src.auth.dependencies import UserDep
from src.database import SessionDep
from src.base.schemas import Page, PaginationParams

from .schemas import ProjectCreate, ProjectRead, ProjectSummaryRead, ProjectUpdate
from .service import create_project, delete_project, get_project, list_projects, update_project


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
):
	return get_project(session=session, user=user, project_id=project_id)


@router.get("", response_model=Page[ProjectSummaryRead])
async def list_projects_route(
	session: SessionDep,
	user: UserDep,
	pagination_params: PaginationParams = Depends(),
):
	return list_projects(session=session, user=user, pagination_params=pagination_params)

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ProjectRead)
async def create_project_route(
	session: SessionDep,
	user: UserDep,
	project_create: ProjectCreate,
):
	return create_project(session=session, user=user, project_create=project_create)

@router.put("/{project_id}", response_model=ProjectRead)
async def update_project_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
	project_update: ProjectUpdate,
):
	return update_project(
		session=session,
		user=user,
		project_id=project_id,
		project_update=project_update,
	)

# delete project user must be admin, or project admin
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_route(
	session: SessionDep,
	user: UserDep,
	project_id: int,
):
	delete_project(session=session, user=user, project_id=project_id)
