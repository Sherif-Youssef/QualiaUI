from __future__ import annotations

from typing import Literal, Optional
from pydantic import Field

from .base import InteractionAction
from .types import Interaction


class Waiting(InteractionAction):
    """Pause execution for a fixed duration."""
    action_type: Literal[Interaction.WAITING] = Field(default=Interaction.WAITING, exclude=True)


class Click(InteractionAction):
    """Click an element."""
    action_type: Literal[Interaction.CLICK] = Field(default=Interaction.CLICK, exclude=True)

    target_id: int
    button: Literal["left", "middle", "right"] = "left"
    click_count: int = Field(default=1, ge=1, description="1 = single click, 2 = double click, etc.")
    modifiers: list[Literal["Alt", "ControlOrMeta", "Shift"]] | None = Field(default=None, description="Keyboard modifiers held during click.")


class Fill(InteractionAction):
    """Clear a field and type a new value. Emit multiple Fills for multiple fields."""
    action_type: Literal[Interaction.FILL] = Field(default=Interaction.FILL, exclude=True)

    target_id: int
    value: str
    clear_first: bool = True


class Hover(InteractionAction):
    """Move the cursor over an element (e.g. to reveal a tooltip or dropdown)."""
    action_type: Literal[Interaction.HOVER] = Field(default=Interaction.HOVER, exclude=True)

    target_id: int


class SelectOption(InteractionAction):
    """Pick an <option> from a <select>. Supply exactly one of value/label/index/option_element_id."""
    action_type: Literal[Interaction.SELECT] = Field(default=Interaction.SELECT, exclude=True)

    select_element_id: int = Field(description="The <select> element.")
    select_by: Literal["value", "label", "index", "element"] = "value"
    select_value: str | int = Field(description="The value, label text, 0-based index, or element id depending on select_by.")


class Press(InteractionAction):
    """Send keystrokes, optionally focused on an element."""
    action_type: Literal[Interaction.PRESS] = Field(default=Interaction.PRESS, exclude=True)

    key: str = Field(min_length=1, description='Keys to press separated by "+". Uses Playwright key names: "Enter", "Tab", "ArrowDown", "Control+a", etc.')
    target_id: Optional[int] = Field(default=None, description="Focus target. None = page-level.")


class Navigate(InteractionAction):
    """Go to a URL."""
    action_type: Literal[Interaction.NAVIGATE] = Field(default=Interaction.NAVIGATE, exclude=True)

    url: str = Field(description="Absolute or relative URL to navigate to.")
    wait_until: Literal["commit", "domcontentloaded", "load", "networkidle"] = "load"

class DragDrop(InteractionAction):
    """Drag one element and drop it onto another."""
    action_type: Literal[Interaction.DRAG_DROP] = Field(default=Interaction.DRAG_DROP, exclude=True)

    source_id: int
    target_id: int


class UploadFile(InteractionAction):
    """Upload one or more files into a file input."""
    action_type: Literal[Interaction.UPLOAD] = Field(default=Interaction.UPLOAD)

    target_id: int = Field(description="Element id of the file <input> element.")
    file_vars: list[str] = Field(default_factory=list, description="Variable names referencing file variables to upload.")


# TODO: Support turning off JS executions, and support turning on & off actions dynamically
class ExecuteJS(InteractionAction):
    """Run arbitrary JavaScript in page context. Use only when no other action works."""

    action_type: Literal[Interaction.EXECUTE_JS] = Field(default=Interaction.EXECUTE_JS, exclude=True)

    code: str
