from __future__ import annotations

import re
from typing import Annotated, Literal, Optional
from pydantic import Field

from .base import ExecAction
from ..markers import ElementRef, SourcedFrom, TextResolvable, JSResolvable
from .registry import maps
from ...actions.assertions import *


@maps(AssertState)
class AssertStateExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    state: Literal["visible", "hidden", "attached", "detached", "enabled", "disabled", "editable", "readonly", "focused"]
    negated: bool = Field(default=False)
    timeout: float | None = None


@maps(AssertTextRegex)
class AssertTextRegexExec(ExecAction):
    target_selector: Annotated[Optional[str], SourcedFrom(source="target_id"), ElementRef()] = Field(default=None)
    target_type: Optional[Literal["title", "url"]] = Field(default=None)
    pattern: Annotated[str, TextResolvable()]
    timeout: float | None = None


@maps(AssertChecked)
class AssertCheckedExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    checked: bool = Field(default=True)
    timeout: float | None = None


@maps(AssertElementCount)
class AssertElementCountExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    expected_count: int = Field(ge=0)
    comparison: Literal["eq", "gt", "gte", "lt", "lte"] = Field(default="eq")
    timeout: float | None = None


@maps(AssertJSEval)
class AssertJSEvalExec(ExecAction):
    code: Annotated[str, JSResolvable(), TextResolvable()]
