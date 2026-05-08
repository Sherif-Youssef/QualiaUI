from fastapi import APIRouter, Depends, status, Query

from src.auth.dependencies import UserDep, AdminUserDep
from src.database import SessionDep
from src.base.schemas import Page, PaginationParams
from src.projects.dependencies import ViewerProjectDep, EditorProjectDep, AdminProjectDep

from .schemas import ProjectCreate, ProjectRead, ProjectSummaryRead, ProjectUpdate
from .service import create_project, delete_project, list_projects, update_project


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project_route(
	project: ViewerProjectDep,
):
	return project

@router.get("", response_model=Page[ProjectSummaryRead])
async def list_projects_route(
	session: SessionDep,
	user: UserDep,
	pagination_params: PaginationParams = Depends(),
	name: str | None = Query(None),
):
	return list_projects(
		session=session,
		user=user,
		pagination_params=pagination_params,
		name=name,
	)

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ProjectRead)
async def create_project_route(
	session: SessionDep,
	user: AdminUserDep,
	project_create: ProjectCreate,
):
	return create_project(session=session, project_create=project_create)

@router.put("/{project_id}", response_model=ProjectRead)
async def update_project_route(
	session: SessionDep,
	project: EditorProjectDep,
	project_update: ProjectUpdate,
):
	return update_project(
		session=session,
		project=project,
		project_update=project_update,
	)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_route(
	session: SessionDep,
	project: AdminProjectDep,
):
	delete_project(session=session, project=project)
