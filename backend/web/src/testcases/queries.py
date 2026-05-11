from sqlalchemy import func
from sqlmodel import Session, col, select, and_
from sqlalchemy.orm import selectinload

from src.base.schemas import PaginationParams
from src.projects.models import Project, UserProjectLink
from src.testsuites.models import TestSuite

from .models import TestCase


def get_by_id(session: Session, testsuite_id: int, testcase_id: int) -> TestCase | None:
	statement = (
		select(TestCase)
		.where(TestCase.testsuite_id == testsuite_id, TestCase.id == testcase_id)
		.options(selectinload(TestCase.cookies))
	)
	return session.exec(statement).first()


def get_by_id_with_user_link(
    session: Session,
    testcase_id: int,
    user_id: int,
) -> tuple[TestCase, UserProjectLink | None] | None:
    statement = (
        select(TestCase, UserProjectLink)
        .join(TestSuite, col(TestCase.testsuite_id) == col(TestSuite.id))
        .join(Project, col(TestSuite.project_id) == col(Project.id))
        .outerjoin(
            UserProjectLink,
            and_(
                col(UserProjectLink.project_id) == col(Project.id),
                col(UserProjectLink.user_id) == user_id,
            ),
        )
        .where(col(TestCase.id) == testcase_id)
        .options(selectinload(TestCase.cookies))
    )

    result = session.exec(statement)
    row = result.first()

    if row is None:
        return None

    testcase, user_project_link = row
    return testcase, user_project_link


def get_all(
	session: Session,
	testsuite_id: int,
	pagination_params: PaginationParams,
	name: str | None = None,
) -> list[TestCase]:
	statement = (
		select(TestCase)
		.where(TestCase.testsuite_id == testsuite_id)
	)

	if name:
		statement = statement.where(func.lower(col(TestCase.name)).ilike(f"%{name.lower()}%"))

	statement = (
		statement
		.order_by(col(TestCase.id).asc())
		.limit(pagination_params.limit)
		.offset(pagination_params.offset)
	)
	return list(session.exec(statement).all())


def count(session: Session, testsuite_id: int, name: str | None = None) -> int:
	statement = select(func.count()).select_from(TestCase).where(TestCase.testsuite_id == testsuite_id)
	if name:
		statement = statement.where(func.lower(col(TestCase.name)).ilike(f"%{name.lower()}%"))
	return session.exec(statement).one()  # type: ignore[arg-type]


def delete(session: Session, testcase: TestCase) -> None:
	session.delete(testcase)
