from sqlmodel import Session, col, select
from src.testcases.models import TestCase


def get_all_testcases(session: Session, testsuite_id: int) -> list[TestCase]:
	statement = (
		select(TestCase)
		.where(TestCase.testsuite_id == testsuite_id)
		.order_by(col(TestCase.id).asc())
	)
	return list(session.exec(statement).all())
