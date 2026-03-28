from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel

from .models import TestStatus, TestRunMode


# TestRun

class TestRunBase(BaseModel):
    name: str = ""
    description: str = ""
    mode: TestRunMode
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestRunRead(TestRunBase):
    id: int
    project_id: int


class TestRunCreate(BaseModel):
    name: str = ""
    description: str = ""
    mode: TestRunMode
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestRunUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    mode: TestRunMode | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    status: TestStatus | None = None


# TestCaseRun

class TestCaseRunBase(BaseModel):
    name: str = ""
    description: str = ""
    instruction: str | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus
    termination_reason: str


class TestCaseRunRead(TestCaseRunBase):
    id: int
    testrun_id: int


class TestCaseRunCreate(BaseModel):
    name: str = ""
    description: str = ""
    instruction: str | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus
    termination_reason: str


class TestCaseRunUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    instruction: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    status: TestStatus | None = None
    termination_reason: str | None = None


# TestStepRun

class TestStepRunBase(BaseModel):
    executable: dict | None = None
    screenshot_before: bytes | None = None
    screenshot_after: bytes | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestStepRunRead(TestStepRunBase):
    id: int
    testcaserun_id: int


class TestStepRunCreate(BaseModel):
    executable: dict | None = None
    screenshot_before: bytes | None = None
    screenshot_after: bytes | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestStepRunUpdate(BaseModel):
    executable: dict | None = None
    screenshot_before: bytes | None = None
    screenshot_after: bytes | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    status: TestStatus | None = None


class TestRunBase(BaseModel):
    name: str = ""
    description: str = ""
    mode: TestRunMode
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestRunRead(TestRunBase):
    id: int
    project_id: int


# TestCaseRun (DB)

class TestCaseRunBase(BaseModel):
    name: str = ""
    description: str = ""
    instruction: str | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus
    termination_reason: str


class TestCaseRunRead(TestCaseRunBase):
    id: int
    testrun_id: int


# TestStepRun (DB)

class TestStepRunBase(BaseModel):
    executable: dict | None = None
    screenshot_before: bytes | None = None
    screenshot_after: bytes | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestStepRunRead(TestStepRunBase):
    id: int
    testcaserun_id: int


# Active runs (in-memory)

class ActiveRunStepRead(BaseModel):
    index: int | None = None
    status: str | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    executable: dict | None = None
    screenshot_before: str | None = None  # base64
    screenshot_after: str | None = None   # base64


class ActiveRunCaseRead(BaseModel):
    index: int | None = None
    instruction: str | None = None
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    is_finalized: bool
    abort_reason: str | None = None
    steps: list[ActiveRunStepRead] = []


class ActiveRunInfo(BaseModel):
    run_id: str
    project_id: int
    name: str
    description: str
    mode: TestRunMode
    base_url: str


class ActiveRunDetail(ActiveRunInfo):
    cases: list[ActiveRunCaseRead] = []
