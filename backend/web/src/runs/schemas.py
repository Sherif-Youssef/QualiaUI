from typing import Optional, Literal
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.base.schemas import Scope
from src.runs.models import RunMode, RunStatus, TestCaseStepRunStatus
from src.llms.schemas import LLMModelRead
from src.auth.schemas import UserRead



class TestsuiteStartRunRequest(BaseModel):
    mode: RunMode
    testsuite_id: int
    use_screenshots: bool = False
    use_video: bool = False
    llm_model_id: int
    timeout: int = 60000
    should_group_actions: bool = False

class TestcaseStartRunRequest(BaseModel):
    mode: RunMode
    testcase_id: int
    use_screenshots: bool = False
    use_video: bool = True
    llm_model_id: int
    timeout: int = 60000
    should_group_actions: bool = False


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
    llm_action: dict | None = None
    
    intent: str | None 
    recreation_prompt: str | None

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
    use_screenshots: bool
    use_video: bool

    base_url: str
    name: str
    instruction: str | None = None
    status: RunStatus
    termination_reason: str | None = None
    
    video_url: str | None = None
    video_upload_task_id: str | None = None
    
    testcase_id: int
    testsuite_run_id: int | None = None
    llm_model: LLMModelRead | None = None
    user: UserRead | None = None

    start_cookies: list[dict] = []

    timeout: int
    should_group_actions: bool 
    
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
    
    name: str
    mode: RunMode
    status: RunStatus
    use_screenshots: bool
    use_video: bool

    testsuite_id: int
    llm_model: LLMModelRead | None = None
    user: UserRead | None = None

    start_cookies: list[dict] = []

    timeout: int
    should_group_actions: bool 

    model_config = ConfigDict(from_attributes=True)


class TestSuiteRunWithCasesRead(TestSuiteRunRead):
    testcase_runs: list[TestCaseRunRead] = Field(default_factory=list)

