from fastapi import HTTPException, status
from sqlmodel import Session

from src.auth.models import User
from src.auth.queries import get_by_ids as get_users_by_ids
from src.base.schemas import PaginationParams, Page


from .models import Project, Role, UserProjectLink
from .queries import get_all_with_link, get_by_id , count, get_with_link, delete
from .schemas import (
	ProjectCreate,
	ProjectSummaryRead,
	ProjectUpdate,
	UserProjectLinkCreate,
)

def list_projects(
    session: Session,
    user: User,
    pagination_params: PaginationParams,
    name: str | None = None,
) -> Page[ProjectSummaryRead]:
    projects = get_all_with_link(session, user.id, pagination_params, name=name) # pyright: ignore[reportArgumentType]
    projects_count = count(session, name=name)

    return Page(
        items=[
            ProjectSummaryRead(
                id=project.id,  # type: ignore[arg-type]
                name=project.name,
                description=project.description,
                user_role=user_project_link.role if user_project_link else None,
            )
            for project, user_project_link in projects
        ],
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=projects_count,
    )


def _build_member_links(
    session: Session,
    members: list[UserProjectLinkCreate]
) -> list[UserProjectLink]:

    user_ids = [m.user_id for m in members]

    if len(user_ids) != len(set(user_ids)):
        raise HTTPException(status_code=400, detail="Duplicate members received.")
    
    existing_users = get_users_by_ids(session, user_ids)
    existing_user_ids = {u.id for u in existing_users}

    missing_ids = set(user_ids) - existing_user_ids
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Some users not found: {list(missing_ids)}"
        )
    
    return [
        UserProjectLink(
            user_id=m.user_id,
            project_id=None,
            role=m.role
        )
        for m in members
    ]


def create_project(session: Session, project_create: ProjectCreate) -> Project:
    project = Project(
        name=project_create.name,
        description=project_create.description,
    )

    project.users_links = _build_member_links(session, project_create.members)

    session.add(project)
    session.commit()
    session.flush()

    return project


def update_project(session: Session, project: Project, project_update: ProjectUpdate) -> Project:
    if project_update.name is not None:
        project.name = project_update.name
    if project_update.description is not None:
        project.description = project_update.description
    if project_update.members is not None:
        project.users_links = _build_member_links(session, project_update.members)

    session.add(project)
    session.flush()
    session.commit()

    return project

def delete_project(session: Session, project: Project):
    delete(session, project)
    session.commit()
