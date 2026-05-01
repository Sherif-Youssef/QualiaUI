from __future__ import annotations

from typing import Annotated, Literal, Optional
from pathlib import Path
from pydantic import Field

from .base import ExecAction
from .registry import maps
from automation_engine.compilation.markers import ElementRef, SourcedFrom, TextResolvable, JSResolvable, FileVarRef
from automation_engine.actions.interactions import *


@maps(Wait)
class WaitExec(ExecAction):
    action_type: Literal[Interaction.WAIT] = Interaction.WAIT
    timeout: float = Field(default=1000, description="Milliseconds to wait.")


@maps(Click)
class ClickExec(ExecAction):
    action_type: Literal[Interaction.CLICK] = Interaction.CLICK
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    button: Literal["left", "middle", "right"] = "left"
    click_count: int = Field(default=1, ge=1)
    modifiers: list[Literal["Alt", "ControlOrMeta", "Shift"]] | None = None
    timeout: float | None = None


@maps(Fill)
class FillExec(ExecAction):
    action_type: Literal[Interaction.FILL] = Interaction.FILL
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    value: Annotated[str, TextResolvable()]
    clear_first: bool = True
    timeout: float | None = None


@maps(Hover)
class HoverExec(ExecAction):
    action_type: Literal[Interaction.HOVER] = Interaction.HOVER
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    timeout: float | None = None


@maps(SelectOption)
class SelectOptionExec(ExecAction):
    action_type: Literal[Interaction.SELECT] = Interaction.SELECT
    target_selector: Annotated[str, SourcedFrom(source="select_element_id"), ElementRef()]
    value: Annotated[Optional[str], TextResolvable()] = None
    label: Annotated[Optional[str], TextResolvable()] = None
    index: Optional[int] = Field(default=None, ge=0)
    timeout: float | None = None


@maps(Press)
class PressExec(ExecAction):
    action_type: Literal[Interaction.PRESS] = Interaction.PRESS
    key: str = Field(description='Key combo string, e.g. "Enter", "Control+a".')
    target_selector: Annotated[Optional[str], SourcedFrom(source="target_id"), ElementRef()] = None
    timeout: float | None = None


@maps(Navigate)
class NavigateExec(ExecAction):
    action_type: Literal[Interaction.NAVIGATE] = Interaction.NAVIGATE
    url: Annotated[str, TextResolvable()]
    wait_until: Literal["commit", "domcontentloaded", "load", "networkidle"] = "load"
    timeout: float | None = None


@maps(DragDrop)
class DragDropExec(ExecAction):
    action_type: Literal[Interaction.DRAG_DROP] = Interaction.DRAG_DROP
    source_selector: Annotated[str, SourcedFrom(source="source_id"), ElementRef()]
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    timeout: float | None = None


@maps(UploadFile)
class UploadFileExec(ExecAction):
    action_type: Literal[Interaction.UPLOAD] = Interaction.UPLOAD
    target_selector: Annotated[str, SourcedFrom(source="target_id"), ElementRef()]
    files: Annotated[list[Path | str], SourcedFrom(source="file_vars"), FileVarRef()] = Field(min_length=1)
    timeout: float | None = None


@maps(ExecuteJS)
class ExecuteJSExec(ExecAction):
    action_type: Literal[Interaction.EXECUTE_JS] = Interaction.EXECUTE_JS
    code: Annotated[str, JSResolvable(), TextResolvable()]
    # TODO: Support timeouts
    # TODO: Support some context functions for the JS to call to get info about the page, element id to selector conversion, variables, etc.
    # timeout: float | None = None
