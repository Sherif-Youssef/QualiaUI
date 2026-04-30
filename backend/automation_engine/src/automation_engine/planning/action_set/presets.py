from automation_engine.actions import (
    Click, Fill, Hover, SelectOption, Press, Navigate,
    DragDrop, UploadFile, ExecuteJS, Waiting,
    Complete, Fail,
)
from .base import ActionSet

_TERMINATIONS = (Complete, Fail)

FULL = ActionSet(
    name="full",
    actions=(Click, Fill, Hover, SelectOption, Press, Navigate, DragDrop, UploadFile, ExecuteJS, Waiting),
    terminations=_TERMINATIONS,
    description="All interactions and assertions.",
)
