from datetime import datetime, timezone

import pytest

from src.runs.models import (
    TestCaseRun,
    TestRun,
    TestRunMode,
    TestStatus,
    TestStepRun,
)


@pytest.fixture
def testrun_factory(session):
    def _create(
        project_id: int,
        run_uid: str,
        name: str = "",
        description: str = "",
        mode: TestRunMode = TestRunMode.NATURAL,
        status: TestStatus = TestStatus.PASSED,
        started_at: datetime | None = None,
        finished_at: datetime | None = None,
    ) -> TestRun:
        now = datetime.now(timezone.utc)
        testrun = TestRun(
            project_id=project_id,
            run_uid=run_uid,
            name=name,
            description=description,
            mode=mode,
            status=status,
            started_at=started_at or now,
            finished_at=finished_at or now,
        )
        session.add(testrun)
        session.commit()
        session.refresh(testrun)
        return testrun

    return _create


@pytest.fixture
def testcaserun_factory(session):
    def _create(
        testrun_id: int,
        name: str = "",
        description: str = "",
        base_url: str = "https://example.com",
        instruction: str | None = None,
        termination_reason: str = "",
        status: TestStatus = TestStatus.PASSED,
        started_at: datetime | None = None,
        finished_at: datetime | None = None,
    ) -> TestCaseRun:
        now = datetime.now(timezone.utc)
        testcaserun = TestCaseRun(
            testrun_id=testrun_id,
            name=name,
            description=description,
            base_url=base_url,
            instruction=instruction,
            termination_reason=termination_reason,
            status=status,
            started_at=started_at or now,
            finished_at=finished_at or now,
        )
        session.add(testcaserun)
        session.commit()
        session.refresh(testcaserun)
        return testcaserun

    return _create


@pytest.fixture
def teststeprun_factory(session):
    def _create(
        testcaserun_id: int,
        executable: dict | None = None,
        screenshot_before: bytes | None = None,
        screenshot_after: bytes | None = None,
        error_message: str | None = None,
        status: TestStatus = TestStatus.PASSED,
        started_at: datetime | None = None,
        finished_at: datetime | None = None,
    ) -> TestStepRun:
        now = datetime.now(timezone.utc)
        teststeprun = TestStepRun(
            testcaserun_id=testcaserun_id,
            executable=executable,
            screenshot_before=screenshot_before,
            screenshot_after=screenshot_after,
            error_message=error_message,
            status=status,
            started_at=started_at or now,
            finished_at=finished_at or now,
        )
        session.add(teststeprun)
        session.commit()
        session.refresh(teststeprun)
        return teststeprun

    return _create


