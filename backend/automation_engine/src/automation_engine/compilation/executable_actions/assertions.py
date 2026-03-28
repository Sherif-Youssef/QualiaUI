from __future__ import annotations

from typing import Annotated, Literal, Optional
from pydantic import Field

from .base import ExecAction
from ..markers import ElementRef, SourcedFrom, TextResolvable, JSResolvable
from .registry import maps
from ...actions.assertions import *


@maps(AssertState)
class AssertStateExec(ExecAction):
    action_type: Literal[Assertion.STATE] = Assertion.STATE 
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    state: Literal["visible", "hidden", "attached", "detached", "enabled", "disabled", "editable", "readonly", "focused"]
    negated: bool = Field(default=False)
    timeout: float | None = None


@maps(AssertTextRegex)
class AssertTextRegexExec(ExecAction):
    action_type: Literal[Assertion.TEXT_REGEX] = Assertion.TEXT_REGEX 
    target_selector: Annotated[Optional[str], SourcedFrom(source="target_id"), ElementRef()] = Field(default=None)
    target_type: Optional[Literal["title", "url"]] = Field(default=None)
    pattern: Annotated[str, TextResolvable()]
    timeout: float | None = None


@maps(AssertChecked)
class AssertCheckedExec(ExecAction):
    action_type: Literal[Assertion.CHECKED] = Assertion.CHECKED 
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    checked: bool = Field(default=True)
    timeout: float | None = None


@maps(AssertElementCount)
class AssertElementCountExec(ExecAction):
    action_type: Literal[Assertion.ELEMENT_COUNT] = Assertion.ELEMENT_COUNT 
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    expected_count: int = Field(ge=0)
    comparison: Literal["eq", "gt", "gte", "lt", "lte"] = Field(default="eq")
    timeout: float | None = None


@maps(AssertJSEval)
class AssertJSEvalExec(ExecAction):
    action_type: Literal[Assertion.JS_EVAL] = Assertion.JS_EVAL 
    code: Annotated[str, JSResolvable(), TextResolvable()]
