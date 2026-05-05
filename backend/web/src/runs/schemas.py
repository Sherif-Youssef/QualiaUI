from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.base.schemas import Scope
from src.runs.models import RunMode, RunStatus, TestCaseStepRunStatus


class ProjectStartRunRequest(BaseModel):
    mode: RunMode
    project_id: int

class TestsuiteStartRunRequest(BaseModel):
    mode: RunMode
    testsuite_id: int

class TestcaseStartRunRequest(BaseModel):
    mode: RunMode
    testcase_id: int

class StartRunResponse(BaseModel):
    scope: str
    run_id: int
    mode: RunMode
    status: RunStatus 
    created_at: datetime


class TestStepRunRead(BaseModel):
    id: int
    executable: dict | None = None
    screenshot_before: str | None = None
    screenshot_after: str | None = None
    error_message: str | None = None
    llm_action: str | None = None
    status: TestCaseStepRunStatus
    testcase_run_id: int

    model_config = ConfigDict(from_attributes=True)



class TestCaseRunRead(BaseModel):
    id: int
    scope: Scope
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    job_uid: str
    mode: RunMode
    base_url: str
    instruction: str | None = None
    status: RunStatus
    termination_reason: str | None = None
    testcase_id: int
    testsuite_run_id: int | None = None
    name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TestCaseRunWithStepsRead(TestCaseRunRead):
    teststep_runs: list[TestStepRunRead] = Field(default_factory=list)


class TestSuiteRunRead(BaseModel):
    id: int
    scope: Scope
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    job_uid: str
    mode: RunMode
    status: RunStatus
    testsuite_id: int
    project_run_id: int | None = None
    name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TestSuiteRunWithCasesRead(TestSuiteRunRead):
    testcase_runs: list[TestCaseRunRead] = Field(default_factory=list)


class ProjectRunRead(BaseModel):
    id: int
    scope: Scope
    created_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    job_uid: str
    mode: RunMode
    status: RunStatus
    project_id: int
    name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectRunWithSuitesRead(ProjectRunRead):
    testsuite_runs: list[TestSuiteRunRead] = Field(default_factory=list)

