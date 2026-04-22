from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from .state import ModelState
from .output_mode.base import PlanningMode


class PlanningDeps(BaseModel):
    """Runtime dependencies injected into the pydantic-ai agent."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    input_state: ModelState
    mode: PlanningMode
