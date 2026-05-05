from datetime import datetime, timezone
from enum import StrEnum
from typing import TYPE_CHECKING, Optional

from sqlmodel import Column, Field, JSON, Relationship, SQLModel


# if TYPE_CHECKING:
from src.projects.models import Project
from src.testcases.models import TestCase
from src.testsuites.models import TestSuite

from src.base.schemas import Scope

class RunStatus(StrEnum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    ERROR = "ERROR"
    ABORTED = "ABORTED"

class TestCaseStepRunStatus(StrEnum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    ERROR = "ERROR"

class RunMode(StrEnum):
    NATURAL = "NATURAL"
    EXECUTABLE = "EXECUTABLE"


class ProjectRun(SQLModel, table=True):
    __tablename__ = "project_run"

    id: int | None = Field(default=None, primary_key=True)

    scope: Scope = Field(default=Scope.PROJECT, nullable=False)

    # fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    started_at: datetime | None = Field(default=None, nullable=True)
    finished_at: datetime | None = Field(default=None, nullable=True)
    job_uid: str = Field(unique=True, index=True, nullable=False)

    mode: RunMode
    status: RunStatus = Field(default=RunStatus.QUEUED) 

    # entity
    project_id: int = Field(foreign_key="project.id", ondelete="CASCADE")
    project: "Project" = Relationship(back_populates="runs")

    @property
    def name(self) -> str | None:
        return self.project.name if getattr(self, "project", None) else None

    # lower
    testsuite_runs: list["TestSuiteRun"] = Relationship(back_populates="project_run")

class TestSuiteRun(SQLModel, table=True):
    __tablename__ = "testsuite_run"

    """A test suite run"""
    id: int | None = Field(default=None, primary_key=True)

    # scope (test suite or project)
    scope: Scope = Field(default=Scope.TESTSUITE, nullable=False)
    
    # fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    started_at: datetime | None = Field(default=None, nullable=True)
    finished_at: datetime | None = Field(default=None, nullable=True)
    job_uid: str = Field(unique=True, index=True, nullable=False)

    mode: RunMode
    status: RunStatus = Field(default=RunStatus.QUEUED)

    # entity
    testsuite_id: int = Field(foreign_key="testsuite.id", ondelete="CASCADE")
    testsuite: "TestSuite" = Relationship(back_populates="runs")

    @property
    def name(self) -> str | None:
        return self.testsuite.name if getattr(self, "testsuite", None) else None

    # upper
    project_run_id: int | None = Field(foreign_key="project_run.id", ondelete="CASCADE", nullable=True)
    project_run: Optional["ProjectRun"]  = Relationship(back_populates="testsuite_runs")

    # lower
    testcase_runs: list["TestCaseRun"] = Relationship(back_populates="testsuite_run")


class TestCaseRun(SQLModel, table=True):
    __tablename__ = "testcase_run"

    """A test case run in the test suite"""
    id: int | None = Field(default=None, primary_key=True)

    # scope (test case, test suite or project)
    scope: Scope = Field(default=Scope.TESTCASE, nullable=False)

    # fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    started_at: datetime | None = Field(default=None, nullable=True)
    finished_at: datetime | None = Field(default=None, nullable=True)
    job_uid: str = Field(unique=True, index=True, nullable=False)
    mode: RunMode

    base_url: str
    instruction: str | None = Field(default=None)
    status: RunStatus = Field(default=RunStatus.QUEUED)
    termination_reason: str | None = Field(default=None)

    # entity
    testcase_id: int = Field(foreign_key="testcase.id", ondelete="CASCADE")
    testcase: "TestCase" = Relationship(back_populates="runs")

    @property
    def name(self) -> str | None:
        return self.testcase.name if getattr(self, "testcase", None) else None

    # upper
    testsuite_run_id: int | None = Field(foreign_key="testsuite_run.id", ondelete="CASCADE", nullable=True)
    testsuite_run: Optional["TestSuiteRun"] = Relationship(back_populates="testcase_runs")

    # lower
    teststep_runs: list["TestStepRun"] = Relationship(back_populates="testcase_run")


class TestStepRun(SQLModel, table=True):
    __tablename__ = "teststep_run"

    """A test step run in the test case"""
    id: int | None = Field(default=None, primary_key=True)
    
    # fields
    executable: dict | None = Field(default=None, sa_column=Column(JSON))
    screenshot_before: str | None = Field(default=None, nullable=True)
    screenshot_after: str | None = Field(default=None, nullable=True)
    error_message: str | None = Field(default=None, nullable=True)
    llm_action: str | None = Field(default=None, nullable=True)
    status: TestCaseStepRunStatus = Field(nullable=False)


    # upper
    testcase_run_id: int = Field(foreign_key="testcase_run.id", ondelete="CASCADE")
    testcase_run: "TestCaseRun" = Relationship(back_populates="teststep_runs")
