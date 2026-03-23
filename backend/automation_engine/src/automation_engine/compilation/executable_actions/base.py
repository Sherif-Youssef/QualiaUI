from __future__ import annotations

from pydantic import BaseModel


class ExecAction(BaseModel):
    """Base for executable actions whose fields map 1-to-1 to PlaywrightBrowser method kwargs."""
    ...
