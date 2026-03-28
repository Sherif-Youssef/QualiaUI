from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field
from pydantic_core import core_schema
import base64

from ..models import TestStatus, TestRunMode


class Base64Bytes(bytes):
    @classmethod
    def __get_pydantic_core_schema__(cls, source, handler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.bytes_schema()
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, bytes):
            return base64.b64encode(v).decode()
        return v


# TestRun

class TestRunBase(BaseModel):
    name: str = ""
    description: str = ""
    mode: TestRunMode
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestRunRead(TestRunBase):
    id: str = Field(validation_alias="run_uid")
    project_id: int


# TestCaseRun

class TestCaseRunBase(BaseModel):
    base_url: str
    name: str = ""
    description: str = ""
    instruction: str | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestCaseRunRead(TestCaseRunBase):
    id: int
    testrun_id: int


# TestStepRun

class TestStepRunBase(BaseModel):
    executable: dict | None = None
    llm_action: str | None = None
    screenshot_before: Base64Bytes | None = None
    screenshot_after: Base64Bytes | None = None
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class TestStepRunRead(TestStepRunBase):
    id: int
    testcaserun_id: int
