from __future__ import annotations

from typing import Any, Literal, Optional
from pathlib import Path
from pydantic import Field
from .base import ExecAction


class WaitingExec(ExecAction):
    ms: float = Field(default=1000, description="Milliseconds to wait.")


class ClickExec(ExecAction):
    target_selector: str
    button: Literal["left", "middle", "right"] = "left"
    click_count: int = Field(default=1, ge=1, description="1 = single click, 2 = double click, etc.")
    modifiers: list[Literal["Alt", "ControlOrMeta", "Shift"]] | None = Field(default=None, description="Keyboard modifiers held during click.")
    timeout: float | None = None


class FillExec(ExecAction):
    target_selector: str
    value: str = Field(description="Text to type into the element.")
    clear_first: bool = Field(default=True, description="Whether to clear existing content before typing.")
    timeout: float | None = None


class HoverExec(ExecAction):
    target_selector: str
    timeout: float | None = None


class SelectOptionExec(ExecAction):
    target_selector: str = Field(description="CSS selector of the <select> element.")
    value: Optional[str] = Field(default=None, description="Value attribute of the option.")
    label: Optional[str] = Field(default=None, description="Visible text of the option.")
    index: Optional[int] = Field(default=None, ge=0, description="0-based index of the option.")
    timeout: float | None = None


class PressExec(ExecAction):
    key: str = Field(description='Key combo string, e.g. "Enter", "Control+a".')
    targer_selector: Optional[str] = Field(default=None, description="Element to focus before pressing. None → page-level.")
    timeout: float | None = None


class FocusExec(ExecAction):
    target_selector: str
    timeout: float | None = None


class NavigateExec(ExecAction):
    url: str = Field(description="Absolute or relative URL to navigate to.")
    wait_until: Literal["commit", "domcontentloaded", "load", "networkidle"] = Field(default="load", description="When to consider navigation succeeded.")
    timeout: float | None = None


class ScrollExec(ExecAction):
    target_selector: str = Field(description="CSS selector of the element to scroll into view.")
    timeout: float | None = None


class DragDropExec(ExecAction):
    source_selector: str = Field(description="CSS selector of the element to drag.")
    target_selector: str = Field(description="CSS selector of the drop target.")
    timeout: float | None = None


class UploadFileExec(ExecAction):
    target_selector: str = Field(description="CSS selector of the file <input> element.")
    files: list[Path] = Field(min_length=1, description="Absolute paths to file(s) to upload.")
    timeout: float | None = None


class ExecuteJSExec(ExecAction):
    expression: str = Field(description="JavaScript code to execute.")
    arg: Any = Field(default=None, description="Optional argument passed to the JS expression.")
