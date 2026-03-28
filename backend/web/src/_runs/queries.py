from sqlalchemy import func
from sqlmodel import Session, col, select

from src.base.schemas import PaginationParams

from .models import TestRun, TestCaseRun, TestStepRun


# TestRun queries

def get_testrun_by_id(session: Session, project_id: int, testrun_id: int) -> TestRun | None:
    statement = (
        select(TestRun)
        .where(TestRun.project_id == project_id, TestRun.id == testrun_id)
    )
    return session.exec(statement).first()


def get_all_testruns(session: Session, project_id: int, pagination_params: PaginationParams) -> list[TestRun]:
    statement = (
        select(TestRun)
        .where(TestRun.project_id == project_id)
        .order_by(col(TestRun.id).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_testruns(session: Session, project_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(TestRun)
        .where(TestRun.project_id == project_id)
    )
    return session.exec(statement).one()  # type: ignore[arg-type]


def delete_testrun(session: Session, testrun: TestRun) -> None:
    session.delete(testrun)


# TestCaseRun queries

def get_testcaserun_by_id(session: Session, testrun_id: int, testcaserun_id: int) -> TestCaseRun | None:
    statement = (
        select(TestCaseRun)
        .where(TestCaseRun.testrun_id == testrun_id, TestCaseRun.id == testcaserun_id)
    )
    return session.exec(statement).first()


def get_all_testcaseruns(session: Session, testrun_id: int, pagination_params: PaginationParams) -> list[TestCaseRun]:
    statement = (
        select(TestCaseRun)
        .where(TestCaseRun.testrun_id == testrun_id)
        .order_by(col(TestCaseRun.id).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_testcaseruns(session: Session, testrun_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(TestCaseRun)
        .where(TestCaseRun.testrun_id == testrun_id)
    )
    return session.exec(statement).one()  # type: ignore[arg-type]


def delete_testcaserun(session: Session, testcaserun: TestCaseRun) -> None:
    session.delete(testcaserun)


# TestStepRun queries

def get_teststeprun_by_id(session: Session, testcaserun_id: int, teststeprun_id: int) -> TestStepRun | None:
    statement = (
        select(TestStepRun)
        .where(TestStepRun.testcaserun_id == testcaserun_id, TestStepRun.id == teststeprun_id)
    )
    return session.exec(statement).first()


def get_all_teststepruns(session: Session, testcaserun_id: int, pagination_params: PaginationParams) -> list[TestStepRun]:
    statement = (
        select(TestStepRun)
        .where(TestStepRun.testcaserun_id == testcaserun_id)
        .order_by(col(TestStepRun.id).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_teststepruns(session: Session, testcaserun_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(TestStepRun)
        .where(TestStepRun.testcaserun_id == testcaserun_id)
    )
    return session.exec(statement).one()  # type: ignore[arg-type]


def delete_teststeprun(session: Session, teststeprun: TestStepRun) -> None:
    session.delete(teststeprun)
