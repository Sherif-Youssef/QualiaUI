from __future__ import annotations

from typing import Annotated, Literal, Optional
from pathlib import Path
from pydantic import Field

from .base import ExecAction
from .registry import maps
from ..markers import ElementRef, SourcedFrom, TextResolvable, JSResolvable, FileVarRef
from ...actions.interactions import *


@maps(Waiting)
class WaitingExec(ExecAction):
    timeout: float = Field(default=1000, description="Milliseconds to wait.")


@maps(Click)
class ClickExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    button: Literal["left", "middle", "right"] = "left"
    click_count: int = Field(default=1, ge=1)
    modifiers: list[Literal["Alt", "ControlOrMeta", "Shift"]] | None = None
    timeout: float | None = None


@maps(Fill)
class FillExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    value: Annotated[str, TextResolvable()]
    clear_first: bool = True
    timeout: float | None = None


@maps(Hover)
class HoverExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    timeout: float | None = None


@maps(SelectOption)
class SelectOptionExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="select_element_id"), ElementRef()]
    value: Annotated[Optional[str], TextResolvable()] = None
    label: Annotated[Optional[str], TextResolvable()] = None
    index: Optional[int] = Field(default=None, ge=0)
    timeout: float | None = None


@maps(Press)
class PressExec(ExecAction):
    key: str = Field(description='Key combo string, e.g. "Enter", "Control+a".')
    target_selector: Annotated[Optional[str], ElementRef()] = None
    timeout: float | None = None


@maps(Focus)
class FocusExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    timeout: float | None = None


@maps(Navigate)
class NavigateExec(ExecAction):
    url: Annotated[str, TextResolvable()]
    wait_until: Literal["commit", "domcontentloaded", "load", "networkidle"] = "load"
    timeout: float | None = None


@maps(Scroll)
class ScrollExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    timeout: float | None = None


@maps(DragDrop)
class DragDropExec(ExecAction):
    source_selector: Annotated[str, SourcedFrom(source="source_id"), ElementRef()]
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    timeout: float | None = None


@maps(UploadFile)
class UploadFileExec(ExecAction):
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    files: Annotated[list[Path | str], SourcedFrom(source="file_vars"), FileVarRef()] = Field(min_length=1)
    timeout: float | None = None


@maps(ExecuteJS)
class ExecuteJSExec(ExecAction):
    code: Annotated[str, JSResolvable(), TextResolvable()]
    # TODO: Support timeouts
    # timeout: float | None = None
