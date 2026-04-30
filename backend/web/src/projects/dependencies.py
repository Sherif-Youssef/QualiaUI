from typing import Annotated

from fastapi import Depends, HTTPException, Path
from sqlmodel import Session

from src.auth.dependencies import UserDep
from src.auth.models import User, Role
from src.database import SessionDep

from .models import Project, Role, UserProjectLink
from .queries import get_by_id

def check_project_role(
    user: User,
    link: UserProjectLink | None,
    minimum_role: Role,
) -> None:
    if user.role == Role.ADMIN:
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
        project = get_by_id(session, project_id, load_links=True)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        user_project_link = next(
            (link for link in project.users_links if link.user_id == user.id),
            None,
        )

        check_project_role(user, user_project_link, minimum_role)
        return project

    return dependency

get_viewer_project = _project_dep_factory(Role.VIEWER)
get_editor_project = _project_dep_factory(Role.EDITOR)
get_admin_project = _project_dep_factory(Role.ADMIN)

ViewerProjectDep = Annotated[Project, Depends(get_viewer_project)]
EditorProjectDep = Annotated[Project, Depends(get_editor_project)]
AdminProjectDep  = Annotated[Project, Depends(get_admin_project)]
