from sqlalchemy import func
from sqlmodel import Session, col, select

from src.base.schemas import PaginationParams

from ..models import TestRun, TestCaseRun, TestStepRun


# TestRun queries

def get_testrun_by_run_uid(session: Session, project_id: int, run_uid: str) -> TestRun | None:
    statement = (
        select(TestRun)
        .where(TestRun.project_id == project_id, TestRun.run_uid == run_uid)
    )
    return session.exec(statement).first()


def get_all_testruns(session: Session, project_id: int, pagination_params: PaginationParams) -> list[TestRun]:
    statement = (
        select(TestRun)
        .where(TestRun.project_id == project_id)
        .order_by(col(TestRun.started_at).desc())
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
    return session.exec(statement).one()  # type: ignore[return-value]


def delete_testrun(session: Session, testrun: TestRun) -> None:
    session.delete(testrun)


# TestCaseRun queries

def get_testcaserun_by_id(
    session: Session, run_uid: str, testcaserun_id: int
) -> TestCaseRun | None:
    statement = (
        select(TestCaseRun)
        .join(TestRun, TestCaseRun.testrun_id == TestRun.id)
        .where(TestRun.run_uid == run_uid, TestCaseRun.id == testcaserun_id)
    )
    return session.exec(statement).first()


def get_all_testcaseruns(
    session: Session, run_uid: str, pagination_params: PaginationParams
) -> list[TestCaseRun]:
    statement = (
        select(TestCaseRun)
        .join(TestRun, TestCaseRun.testrun_id == TestRun.id)
        .where(TestRun.run_uid == run_uid)
        .order_by(col(TestCaseRun.started_at).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_testcaseruns(session: Session, run_uid: str) -> int:
    statement = (
        select(func.count())
        .select_from(TestCaseRun)
        .join(TestRun, TestCaseRun.testrun_id == TestRun.id)
        .where(TestRun.run_uid == run_uid)
    )
    return session.exec(statement).one()  # type: ignore[return-value]


# TestStepRun queries

def get_teststeprun_by_id(
    session: Session, run_uid: str, testcaserun_id: int, teststeprun_id: int
) -> TestStepRun | None:
    statement = (
        select(TestStepRun)
        .join(TestCaseRun, TestStepRun.testcaserun_id == TestCaseRun.id)
        .join(TestRun, TestCaseRun.testrun_id == TestRun.id)
        .where(
            TestRun.run_uid == run_uid,
            TestCaseRun.id == testcaserun_id,
            TestStepRun.id == teststeprun_id,
        )
    )
    return session.exec(statement).first()


def get_all_teststepruns(
    session: Session, run_uid: str, testcaserun_id: int, pagination_params: PaginationParams
) -> list[TestStepRun]:
    statement = (
        select(TestStepRun)
        .join(TestCaseRun, TestStepRun.testcaserun_id == TestCaseRun.id)
        .join(TestRun, TestCaseRun.testrun_id == TestRun.id)
        .where(TestRun.run_uid == run_uid, TestCaseRun.id == testcaserun_id)
        .order_by(col(TestStepRun.started_at).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_teststepruns(session: Session, run_uid: str, testcaserun_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(TestStepRun)
        .join(TestCaseRun, TestStepRun.testcaserun_id == TestCaseRun.id)
        .join(TestRun, TestCaseRun.testrun_id == TestRun.id)
        .where(TestRun.run_uid == run_uid, TestCaseRun.id == testcaserun_id)
    )
    return session.exec(statement).one()  # type: ignore[return-value]
