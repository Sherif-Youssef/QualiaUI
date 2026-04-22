from __future__ import annotations

from . import sections
from ..output_mode.base import PlanningMode


class PromptBuilder:
    """Assembles a complete system prompt from composable sections."""

    def __init__(self, mode: PlanningMode) -> None:
        self._mode = mode
        self._prepend: list[str] = []
        self._append: list[str] = []

    def prepend(self, text: str) -> PromptBuilder:
        """Add a section before the standard sections."""
        self._prepend.append(text)
        return self

    def append(self, text: str) -> PromptBuilder:
        """Add a section after the standard sections."""
        self._append.append(text)
        return self

    def build(self) -> str:
        """
        Build the full system prompt.
        """
        parts = [
            *self._prepend,
            sections.ROLE,
            sections.PAGE_FORMAT,
            sections.action_catalog(self._mode.action_set),
            sections.VARIABLES,
            sections.TERMINATION,
            sections.HISTORY,
            sections.DECISION_PROCESS,
            sections.RULES,
            self._mode.get_mode_prompt(),
            *self._append,
        ]

        return "\n\n".join(part for part in parts if part)
