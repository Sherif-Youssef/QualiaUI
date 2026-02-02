from typing import Annotated
from sqlmodel import select
from fastapi import Depends, Path, HTTPException, Body
from src.auth.dependencies import UserDep
from src.auth.repository import UserRepository
from .models import Project, UserProjectLink, Role
from .schemas import UserProjectLinkCreate
from .repository import ProjectRepository


ProjectRepositoryDep = Annotated[ProjectRepository, Depends()]


def get_project(project_id: Annotated[int, Path()], repo: ProjectRepositoryDep) -> Project:
    project = repo.get(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project


ProjectDep = Annotated[Project, Depends(get_project)]


def get_project_link(user: UserDep, project: ProjectDep, repo: ProjectRepositoryDep) -> UserProjectLink:
    link = repo.get_link(project.id, user.id)
    if link is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return link


ProjectLinkDep = Annotated[UserProjectLink, Depends(get_project_link)]


def get_accessable_project(link: ProjectLinkDep) -> Project:
    return link.project


AccessableProjectDep = Annotated[Project, Depends(get_accessable_project)]


def get_editable_project(link: ProjectLinkDep) -> Project:
    if link.role not in (Role.EDITOR, Role.OWNER):
        raise HTTPException(status_code=403, detail="Cannot edit project")
    return link.project


EditableProjectDep = Annotated[Project, Depends(get_editable_project)]


def get_owned_project(link: ProjectLinkDep) -> Project:
    if link.role != Role.OWNER:
        raise HTTPException(status_code=403, detail="Only owner allowed")
    return link.project


OwnedProjectDep = Annotated[Project, Depends(get_owned_project)]


def get_valid_links(user: UserDep, needed_members: Annotated[list[UserProjectLinkCreate], Body()], user_repo: Annotated[UserRepository, Depends()]) -> list[UserProjectLink]:
    member_ids = [link_info.user_id for link_info in needed_members]

    if len(member_ids) != len(set(member_ids)):
        raise ValueError("Duplicate members aren't allowed.")
    if user.id in member_ids:
        raise ValueError("Owner can't be added as a member.")

    members = user_repo.get_by_ids(member_ids)
    if len(members) != len(member_ids):
        raise ValueError("Some members don't exist")
    
    links = [UserProjectLink(user_id=user.id, role=Role.OWNER)]
    links += [UserProjectLink(user_id=link_info.user_id, role=link_info.role) for link_info in needed_members]

    return links


ValidLinksDep = Annotated[list[UserProjectLink], Depends(get_valid_links)]
