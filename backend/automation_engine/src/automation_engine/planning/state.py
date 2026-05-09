from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, ConfigDict

from automation_engine.serialization import PageState, DOMIndex


class ModelState(BaseModel):
    instruction: str
    page: str
    history: Optional[str] = None
    screenshot: Optional[bytes] = None
    last_error: Optional[str] = None


class PageSnapshot(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)
    """BrowserState + optional screenshot (not implemented yet)."""

    state: PageState
    index: DOMIndex
