from typing import Annotated

from fastapi import Depends, HTTPException, Path
from sqlmodel import Session

from src.auth.dependencies import UserDep
from src.auth.service import is_admin
from src.database import SessionDep

from .models import Project, Role, UserProjectLink
from .queries import get_by_id, get_with_link


def _get_project_with_link(
    session: Session,
    project_id: int,
    user_id: int,
) -> tuple[Project, UserProjectLink | None]:
    result = get_with_link(session, project_id, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    return result  # (project, link | None)


def _check_role(
    user,
    link: UserProjectLink | None,
    minimum_role: Role,
) -> None:
    if is_admin(user):
        return
    if link and link.role >= minimum_role:
        return
    raise HTTPException(
        status_code=403,
        detail="You don't have permission required for this action.",
    )


def _project_dep_factory(minimum_role: Role):
    """Factory that returns a Depends-compatible callable for a given role."""

    def dependency(
        session: SessionDep,
        user: UserDep,
        project_id: int = Path(...),
    ) -> Project:
        project, link = _get_project_with_link(session, project_id, user.id)
        _check_role(user, link, minimum_role)
        return project

    return dependency


ViewerProjectDep = Annotated[Project, Depends(_project_dep_factory(Role.VIEWER))]
EditorProjectDep = Annotated[Project, Depends(_project_dep_factory(Role.EDITOR))]
AdminProjectDep  = Annotated[Project, Depends(_project_dep_factory(Role.ADMIN))]
