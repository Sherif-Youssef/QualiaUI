from typing import Annotated
from fastapi import APIRouter, Depends, Path, Body, Query, status
from src.auth.dependencies import UserDep
from src.database import SessionDep
from .schemas import ProjectRead, ProjectCreate, ProjectUpdate
from .models import Project, UserProjectLink
from .dependencies import AccessableProjectDep, EditableProjectDep, OwnedProjectDep, ValidLinksDep, ProjectRepositoryDep

router = APIRouter(
    prefix="/projects",
    tags=["projects"]
)


@router.get("", response_model=list[ProjectRead])
def list_projects(user: UserDep) -> list[Project]:
    return user.projects


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project: AccessableProjectDep) -> Project:
    return project


@router.post("", response_model=ProjectRead)
def create_project(project_info: Annotated[ProjectCreate, Body()], links: ValidLinksDep, repo: ProjectRepositoryDep) -> Project:
    project = Project.model_validate(project_info)
    project.users_links.extend(links)
    return repo.save(project)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project: OwnedProjectDep, project_info: Annotated[ProjectCreate, Body()], links: ValidLinksDep, repo: ProjectRepositoryDep) -> Project:
    project.users_links.clear()
    project.users_links.extend(links)
    project.sqlmodel_update(project_info)
    return repo.save(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project: OwnedProjectDep, repo: ProjectRepositoryDep) -> None:
    repo.delete(project)
