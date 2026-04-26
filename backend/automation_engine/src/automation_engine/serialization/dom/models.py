from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field, ConfigDict

from enum import StrEnum


class Visibility(StrEnum):
    HIDDEN = "hidden"
    IN_VIEWPORT_FULL = "in_viewport_full"
    IN_VIEWPORT_PARTIAL = "in_viewport_partial"
    OUT_OF_VIEWPORT = "out_of_viewport"


class ElementPosition(BaseModel):
    x: int = Field(description="X coordinate of the element's top-left corner.")
    y: int = Field(description="Y coordinate of the element's top-left corner.")
    width: int = Field(description="Element width in pixels.")
    height: int = Field(description="Element height in pixels.")

    @property
    def center(self) -> tuple[int, int]:
        return (self.x + self.width // 2, self.y + self.height // 2)

    @property
    def area(self) -> int:
        return self.width * self.height


class DOMElement(BaseModel):
    """Single node in the serialized DOM tree."""

    model_config = ConfigDict(extra="forbid")

    element_id: int = Field(description="Unique id assigned during DOM serialization.")
    is_interactive: bool = Field(description="True if the element accepts user interaction.")
    tag: str = Field(description="HTML tag name (lowercase).")
    text: str | None = Field(default=None, description="Visible text content of the element.")
    position: ElementPosition = Field(description="Bounding box of the element.")
    visibility: Visibility = Field(description="Viewport-relative visibility status.")
    attributes: dict[str, Any] = Field(default_factory=dict, description="HTML attributes; 'dataset' key holds data-* as a nested dict.")
    selector: str = Field(description="Unique CSS selector for engine resolution.")
    depth: int = Field(default=0, description="Nesting depth in the visual hierarchy.")
    children: list[DOMElement] = Field(default_factory=list, description="Direct child elements.")

    def attr(self, name: str, default: str | None = None) -> str | None:
        """Safe attribute access."""
        val = self.attributes.get(name, default)
        return val if not isinstance(val, dict) else None

    def data_attr(self, name: str, default: str | None = None) -> str | None:
        """Access a data-* attribute from the dataset sub-dict."""
        dataset = self.attributes.get("dataset")
        if isinstance(dataset, dict):
            return dataset.get(name, default)
        return default

    @property
    def is_disabled(self) -> bool:
        return self.attributes.get("disabled", False)

    @property
    def is_checked(self) -> bool:
        return self.attributes.get("checked", False)

    @property
    def is_required(self) -> bool:
        return self.attributes.get("required", False)

    @property
    def is_selected(self) -> bool:
        return self.attributes.get("selected", False)


class PageState(BaseModel):
    """Snapshot of the browser at a point in time."""

    current_url: str = Field(description="Full URL of the current page.")
    page_title: str = Field(default="", description="Document title.")
    viewport_width: int = Field(default=1280, description="Viewport width in pixels.")
    viewport_height: int = Field(default=720, description="Viewport height in pixels.")
    root: DOMElement = Field(description="Root of the serialized DOM tree.")
    screenshot: bytes | None = Field(default=None, description="Optional PNG screenshot of the page.")


class NormalizedRole(StrEnum):
    """Normalized semantic roles visible to the LLM."""

    BUTTON = "button"
    LINK = "link"
    TEXT_FIELD = "text_field"
    TEXT_AREA = "text_area"
    DROPDOWN = "dropdown"
    OPTION = "option"
    CHECKBOX = "checkbox"
    RADIO = "radio"

    HEADING = "heading"
    IMAGE = "image"
    TEXT = "text"

    FORM = "form"
    DIALOG = "dialog"
    LIST = "list"
    LIST_ITEM = "list_item"
    TABLE = "table"
    ROW = "row"
    CELL = "cell"
    GROUP = "group"


class NormalizedDOMElement(BaseModel):
    """Simplified, LLM-friendly representation of a DOM node."""

    element_id: int
    role: NormalizedRole
    input_subtype: str | None
    is_interactive: bool
    display_text: str | None
    href: str | None
    value: str | None
    is_disabled: bool
    is_required: bool
    is_checked: bool
    is_selected: bool
    position: ElementPosition
    visibility: Visibility
    depth: int
    selector: str
    children: list[NormalizedDOMElement] = Field(default_factory=list)
