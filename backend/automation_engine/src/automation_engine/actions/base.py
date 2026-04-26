from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class BaseAction(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    timeout: Optional[float] = Field(default=None, description="Timeout in milliseconds.")
    intent: str = Field(description="Why this action.", exclude=True)
    recreation_prompt: str = Field(description="Plain-language instruction to reproduce this step (no IDs).", exclude=True)


class InteractionAction(BaseAction):
    """Does something on the page."""
    pass


class TerminationSignal(BaseModel):
    """Signals end-of-task (success or failure)."""
    model_config = ConfigDict(use_enum_values=True)
    
    reason: str
