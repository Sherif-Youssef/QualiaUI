from sqlalchemy import func
from sqlmodel import Session, col, select

from src.base.schemas import PaginationParams

from .models import TestSuite


def get_by_id(session: Session, project_id: int, testsuite_id: int) -> TestSuite | None:
    statement = (
        select(TestSuite)
        .where(TestSuite.project_id == project_id, TestSuite.id == testsuite_id)
    )
    return session.exec(statement).first()


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
