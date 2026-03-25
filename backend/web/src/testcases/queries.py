from sqlalchemy import func
from sqlmodel import Session, col, select

from src.base.schemas import PaginationParams

from .models import TestCase


def get_by_id(session: Session, testsuite_id: int, testcase_id: int) -> TestCase | None:
	statement = (
		select(TestCase)
		.where(TestCase.testsuite_id == testsuite_id, TestCase.id == testcase_id)
	)
	return session.exec(statement).first()


def get_all(session: Session, testsuite_id: int, pagination_params: PaginationParams) -> list[TestCase]:
	statement = (
		select(TestCase)
		.where(TestCase.testsuite_id == testsuite_id)
		.order_by(col(TestCase.id).asc())
		.limit(pagination_params.limit)
		.offset(pagination_params.offset)
	)
	return list(session.exec(statement).all())


def count(session: Session, testsuite_id: int) -> int:
	statement = select(func.count()).select_from(TestCase).where(TestCase.testsuite_id == testsuite_id)
	return session.exec(statement).one()  # type: ignore[arg-type]


def delete(session: Session, testcase: TestCase) -> None:
	session.delete(testcase)
