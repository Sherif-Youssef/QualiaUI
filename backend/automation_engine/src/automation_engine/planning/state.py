from __future__ import annotations

from enum import StrEnum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ModelState(BaseModel):
    instruction: str
    page: str
    history: Optional[str] = None
    screenshot: Optional[bytes] = None


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
    text: Optional[str] = Field(default=None, description="Visible text content of the element.")
    position: ElementPosition = Field(description="Bounding box of the element.")
    visibility: Visibility = Field(description="Viewport-relative visibility status.")
    attributes: dict[str, str | dict[str, str]] = Field(default_factory=dict, description="HTML attributes; 'dataset' key holds data-* as a nested dict.")
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
        return "disabled" in self.attributes

    @property
    def is_checked(self) -> bool:
        return "checked" in self.attributes

    @property
    def is_required(self) -> bool:
        return "required" in self.attributes


class BrowserState(BaseModel):
    """Snapshot of the browser at a point in time."""

    current_url: str = Field(description="Full URL of the current page.")
    page_title: str = Field(default="", description="Document title.")
    viewport_width: int = Field(default=1280, description="Viewport width in pixels.")
    viewport_height: int = Field(default=720, description="Viewport height in pixels.")
    root: DOMElement = Field(description="Root of the serialized DOM tree.")
    screenshot: Optional[bytes] = Field(default=None, description="Optional PNG screenshot of the page.")


class DOMIndex:
    """
    Flattened, O(1)-lookup view over a DOMElement tree.
    """

    __slots__ = ("_by_id",)

    def __init__(self, root: DOMElement) -> None:
        self._by_id: dict[int, DOMElement] = {}
        self._trav(root)

    def _trav(self, node: DOMElement) -> None:
        self._by_id[node.element_id] = node
        for child in node.children:
            self._trav(child)

    def __getitem__(self, element_id: int) -> DOMElement:
        return self._by_id[element_id]

    def get(self, element_id: int) -> Optional[DOMElement]:
        return self._by_id.get(element_id)

    def selector(self, element_id: int) -> str:
        """Shortcut: element_id -> CSS selector."""
        return self[element_id].selector

    def __contains__(self, element_id: int) -> bool:
        return element_id in self._by_id

    def __len__(self) -> int:
        return len(self._by_id)

    @property
    def all_elements(self) -> list[DOMElement]:
        return list(self._by_id.values())

    @property
    def interactive_elements(self) -> list[DOMElement]:
        return [el for el in self._by_id.values() if el.is_interactive]

    @property
    def visible_elements(self, fully: bool = False) -> list[DOMElement]:
        if fully:
            visibility_filter = (Visibility.IN_VIEWPORT_FULL,)
        else:
            visibility_filter = (Visibility.IN_VIEWPORT_FULL, Visibility.IN_VIEWPORT_PARTIAL)
        return [
            el for el in self._by_id.values()
            if el.visibility in visibility_filter
        ]


class PageSnapshot(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)
    """BrowserState + optional screenshot (not implemented yet)."""

    state: BrowserState
    index: DOMIndex
