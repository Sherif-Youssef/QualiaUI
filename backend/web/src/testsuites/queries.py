from sqlalchemy import func
from sqlmodel import Session, col, select, and_
from sqlalchemy.orm import selectinload

from src.base.schemas import PaginationParams
from src.projects.models import Project, UserProjectLink

from .models import TestSuite


def get_by_id(
    session: Session,
    testsuite_id: int,
    *,
    include_testcases: bool = False,
) -> TestSuite | None:
    statement = select(TestSuite).where(
        TestSuite.id == testsuite_id,
    )

    if include_testcases:
        statement = statement.options(selectinload(TestSuite.testcases)) # type: ignore[arg-type]

    return session.exec(statement).first()

def get_by_id_with_user_link(
    session: Session,
    testsuite_id: int,
    user_id: int,
) -> tuple[TestSuite, UserProjectLink | None] | None:
    statement = (
        select(TestSuite, UserProjectLink)
        .join(Project, col(TestSuite.project_id) == col(Project.id))
        .outerjoin(
            UserProjectLink,
            and_(
                UserProjectLink.project_id == Project.id,
                UserProjectLink.user_id == user_id,
            ),
        )
        .where(TestSuite.id == testsuite_id)
    )

    result = session.exec(statement)
    row = result.first()

    if row is None:
        return None  # TestSuite not found

    testsuite, user_project_link = row
    return testsuite, user_project_link  


def get_all(session: Session, project_id: int, pagination_params: PaginationParams) -> list[TestSuite]:
    statement = (
        select(TestSuite)
        .where(TestSuite.project_id == project_id)
        .order_by(col(TestSuite.id).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count(session: Session, project_id: int) -> int:
    statement = select(func.count()).select_from(TestSuite).where(TestSuite.project_id == project_id)
    return session.exec(statement).one()  


def delete(session: Session, testsuite: TestSuite) -> None:
    session.delete(testsuite)
