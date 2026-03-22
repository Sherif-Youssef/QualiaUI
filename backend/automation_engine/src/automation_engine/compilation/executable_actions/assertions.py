from __future__ import annotations

import re
from typing import Any, Literal, Optional
from pydantic import Field

from .base import ExecAction


class AssertStateExec(ExecAction):
    target_selector: str = Field(description="CSS selector of the element to check.")
    state: Literal["visible", "hidden", "attached", "detached", "enabled", "disabled", "editable", "readonly", "focused"] = Field(description="Expected state of the element.")
    negated: bool = Field(default=False, description="If True, asserts the element is NOT in the given state.")
    timeout: float | None = None


class AssertTextRegexExec(ExecAction):
    target_selector: Optional[str] = Field(default=None, description="CSS selector of the element whose text to check. None when target_type is 'title' or 'url'.")
    target_type: Optional[Literal["title", "url"]] = Field(default=None, description="If 'title', checks document.title. If 'url', checks page URL. If None, uses target_selector.")
    pattern: re.Pattern = Field(description="Compiled regex pattern to match against text content.")
    timeout: float | None = None


class AssertCheckedExec(ExecAction):
    target_selector: str = Field(description="CSS selector of the checkbox / radio element.")
    checked: bool = Field(default=True, description="True -> assert checked, False -> assert unchecked.")
    timeout: float | None = None


class AssertElementCountExec(ExecAction):
    target_selector: str = Field(description="CSS selector of the element(s) to count.")
    expected_count: int = Field(ge=0, description="Expected number of matching elements.")
    comparison: Literal["eq", "gt", "gte", "lt", "lte"] = Field(default="eq", description="Comparison operator for the count check.")
    timeout: float | None = None


class AssertJSEvalExec(ExecAction):
    expression: str = Field(description="Resolved JavaScript expression to evaluate.")
    arg: Any = Field(default=None, description="Optional argument passed to the JS expression.")
