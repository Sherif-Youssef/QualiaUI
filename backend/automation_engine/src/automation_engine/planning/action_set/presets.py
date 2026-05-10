from automation_engine.actions import (
    Click, Fill, Hover, SelectOption, Press, Navigate, ReloadPage,
    DragDrop, UploadFile, ExecuteJS, Wait,
    Complete, Fail,
)
from .base import ActionSet

_TERMINATIONS = (Complete, Fail)

FULL = ActionSet(
    name="full",
    actions=(Click, Fill, Hover, SelectOption, Press, Navigate, ReloadPage, DragDrop, UploadFile, ExecuteJS, Wait),
    terminations=_TERMINATIONS,
    description="All interactions and assertions.",
)
