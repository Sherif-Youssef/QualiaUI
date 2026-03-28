from enum import Enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship, Column, JSON


class TestStatus(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    ERROR = "ERROR"
    ABORTED = "ABORTED"


class TestRunMode(str, Enum):
    NATURAL = "NATURAL"
    EXECUTABLE = "EXECUTABLE"


if TYPE_CHECKING:
    from .models import TestCaseRun, TestStepRun


class TestRun(SQLModel, table=True):
    """A test suite run"""
    id: int | None = Field(default=None, primary_key=True)
    project_id: int | None = Field(foreign_key="project.id", ondelete="CASCADE")
    name: str = Field(default="")
    description: str = Field(default="")
    mode: TestRunMode

    started_at: datetime
    finished_at: datetime
    status: TestStatus

    testcases: list["TestCaseRun"] = Relationship(back_populates="testrun")


class TestCaseRun(SQLModel, table=True):
    """A test case run in the test suite"""
    id: int | None = Field(default=None, primary_key=True)
    testrun_id: int | None = Field(foreign_key="testrun.id", ondelete="CASCADE")
    name: str = Field(default="")
    description: str = Field(default="")

    instruction: str | None = Field(default=None)

    started_at: datetime
    finished_at: datetime
    status: TestStatus
    termination_reason: str

    testrun: TestRun = Relationship(back_populates="testcases")
    teststeps: list["TestStepRun"] = Relationship(back_populates="testcaserun")


class TestStepRun(SQLModel, table=True):
    """A test step run in the test case"""
    id: int | None = Field(default=None, primary_key=True)
    testcaserun_id: int | None = Field(foreign_key="testcaserun.id", ondelete="CASCADE")

    executable: dict | None = Field(default=None, sa_column=Column(JSON))

    screenshot_before: bytes | None = Field(default=None)
    screenshot_after: bytes | None = Field(default=None)

    started_at: datetime
    finished_at: datetime
    status: TestStatus

    testcaserun: TestCaseRun = Relationship(back_populates="teststeps")