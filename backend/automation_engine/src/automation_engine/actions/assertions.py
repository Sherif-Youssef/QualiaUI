from __future__ import annotations

from typing import Literal, Optional

from pydantic import Field

from .base import AssertionAction
from .registry import action
from .types import Assertion


@action
class AssertState(AssertionAction):
    """Assert an element's UI state (visible, enabled, focused, etc.)."""
    action_type: Literal[Assertion.STATE] = Assertion.STATE

    target_id: int
    state: Literal["visible", "hidden", "attached", "detached", "enabled", "disabled", "editable", "readonly", "focused"]
    negated: bool = Field(default=False, description="True = assert NOT in state.")


@action
class AssertTextRegex(AssertionAction):
    """Asserts that an element's text content matches a regex pattern."""
    action_type: Literal[Assertion.TEXT_REGEX] = Assertion.TEXT_REGEX

    target_id: int
    target_type: Optional[Literal["title", "url"]] = Field(default=None, description="Check page title/URL instead of element text.")
    pattern: str = Field(description='Regex. ".*foo.*" = contains, "^exact$" = exact.')


@action
class AssertChecked(AssertionAction):
    """Assert a checkbox or radio is checked (or unchecked)."""
    action_type: Literal[Assertion.CHECKED] = Assertion.CHECKED

    target_id: int = Field(description="Element id of the checkbox / radio element.")
    checked: bool = Field(default=True, description="True: assert checked, False: assert unchecked.")


@action
class AssertElementCount(AssertionAction):
    """Assert how many elements match the same selector as target_id."""
    action_type: Literal[Assertion.ELEMENT_COUNT] = Assertion.ELEMENT_COUNT

    target_id: int
    expected_count: int = Field(ge=0)
    comparison: Literal["eq", "gt", "gte", "lt", "lte"] = Field(default="eq", description='"eq" = equal, "gt" = greater than, "gte" = greater or equal, "lt" = less than, "lte" = less or equal.')


@action
class AssertJSEval(AssertionAction):
    """Run JS and assert truthy result. Return {success, error}. Last resort only."""
    action_type: Literal[Assertion.JS_EVAL] = Assertion.JS_EVAL

    code: str
    target_id: Optional[int] = Field(default=None, description="If set, DOM element passed as first arg.")
