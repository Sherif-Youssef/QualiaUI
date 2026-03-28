from __future__ import annotations

import base64
from enum import Enum
from datetime import datetime
from pydantic import BaseModel
from pydantic_core import core_schema

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


class ActiveRunStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    FINISHED = "FINISHED"


class ActiveTestRun(BaseModel):
    run_id: str
    indices: list[int]

    name: str = ""
    description: str = ""
    mode: TestRunMode
    started_at: datetime
    finished_at: datetime | None
    status: ActiveRunStatus


class ActiveTestCaseRun(BaseModel):
    index: int
    base_url: str = ""
    name: str = ""
    description: str = ""
    instruction: str | None = None
    started_at: datetime
    finished_at: datetime | None
    status: ActiveRunStatus


class ActiveTestStepRun(BaseModel):
    """A finished step in an active run."""
    index: int
    executable: dict | None = None
    screenshot_before: Base64Bytes | None = None
    screenshot_after: Base64Bytes | None = None
    llm_action: str | None
    started_at: datetime
    finished_at: datetime
    status: TestStatus


class ActiveTestCaseTermination(BaseModel):
    status: TestStatus
    reason: str | None
