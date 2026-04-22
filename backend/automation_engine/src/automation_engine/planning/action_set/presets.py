from automation_engine.actions import (
    Click, Fill, Hover, SelectOption, Press, Navigate,
    Scroll, DragDrop, UploadFile, ExecuteJS, Waiting,
    AssertState, AssertText, AssertTextRegex, AssertChecked,
    AssertElementCount, AssertJSEval,
    Complete, Fail,
)
from .base import ActionSet

_TERMINATIONS = (Complete, Fail)

INTERACTIVE = ActionSet(
    name="interactive",
    actions=(Click, Fill, Hover, SelectOption, Press, Navigate, Scroll, DragDrop, UploadFile, ExecuteJS, Waiting),
    terminations=_TERMINATIONS,
    description="Browser interactions only.",
)

ASSERTION = ActionSet(
    name="assertion",
    actions=(AssertState, AssertText, AssertTextRegex, AssertChecked, AssertElementCount, AssertJSEval),
    terminations=_TERMINATIONS,
    description="Assertions only.",
)

FULL = ActionSet(
    name="full",
    actions=INTERACTIVE.actions + ASSERTION.actions,
    terminations=_TERMINATIONS,
    description="All interactions and assertions.",
)
