from __future__ import annotations

from abc import ABC, abstractmethod

from automation_engine.actions import BaseAction, TerminationSignal
from ..action_set.base import ActionSet


class PlanningMode(ABC):
    """Controls output schema shape, mode-specific prompts, and output unpacking."""

    def __init__(self, action_set: ActionSet) -> None:
        self._action_set = action_set

    @property
    def action_set(self) -> ActionSet:
        return self._action_set

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def build_output_type(self) -> type:
        """Build the Pydantic model used as result_type for the agent."""
        ...

    @abstractmethod
    def get_mode_prompt(self) -> str:
        """Return mode-specific prompt section."""
        ...

    @abstractmethod
    def unpack(self, raw: object) -> list[BaseAction] | TerminationSignal:
        """Normalize raw agent output into a list of actions or a termination signal."""
        ...
