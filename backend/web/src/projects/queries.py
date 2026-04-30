from typing import TYPE_CHECKING, Tuple

from sqlmodel import Session, and_, col, select
from sqlalchemy import func
from sqlalchemy.orm import selectinload, subqueryload

from src.base.schemas import PaginationParams
from .models import Project, Role, UserProjectLink


if TYPE_CHECKING:
    from src.auth.models import User


def get_by_id(session: Session, project_id: int, load_links: bool = True) -> Project | None:
    """Get one project by id.

    When ``load_links`` is ``True``, user links are eagerly loaded.
    """

    statement = (
        select(Project)
        .where(Project.id == project_id)
    )
    if load_links:
        statement = statement.options(
            subqueryload(Project.users_links).subqueryload(UserProjectLink.user) # type: ignore[arg-type]
        ) 

    return session.exec(statement).first()


def get_with_link(session: Session, project_id: int, user_id: int) -> Tuple[Project, UserProjectLink | None] | None:
    """Get a project and this user's membership link (if it exists).

    Returns:
    - ``None`` when the project does not exist.
    - ``(project, None)`` when the project exists but the user is not linked.
    - ``(project, link)`` when both project and link exist.
    """

    statement = (
        select(Project, UserProjectLink)
            .outerjoin(
                UserProjectLink,
                and_(
                    UserProjectLink.project_id == Project.id,
                    UserProjectLink.user_id == user_id,
                ),
            )
            .where(Project.id == project_id) 
    )

    return session.exec(statement).first()


def get_all_with_link(
    session: Session,
    user_id: int,
    pagination_params: PaginationParams,
) -> list[Tuple[Project, UserProjectLink | None]]:
    """Get a paginated list of projects with this user's link per project.

    Each item is ``(project, link_or_none)`` and results are ordered by
    project id.
    """

    order_statement = col(Project.id).asc()
    statement = (
        select(Project, UserProjectLink)
            .outerjoin(
                UserProjectLink,
                and_(
                    UserProjectLink.project_id == Project.id,
                    UserProjectLink.user_id == user_id,
                ),
            )
            .order_by(order_statement)
            .limit(pagination_params.limit)
            .offset(pagination_params.offset)
    )

    return list(session.exec(statement).all())


def count(session: Session) -> int:
    return session.exec(select(func.count(Project.id))).one()  # type: ignore[arg-type]


def delete(session: Session, project: Project) -> None:
    session.delete(project)
