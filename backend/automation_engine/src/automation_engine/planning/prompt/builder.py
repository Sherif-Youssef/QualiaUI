from __future__ import annotations

from pathlib import Path

from automation_engine.planning.output_mode.base import PlanningMode


class PromptBuilder:
    """Assembles a complete system prompt from composable sections."""

    def __init__(self, mode: PlanningMode) -> None:
        self._mode = mode
        self._static_system_prompt = self._read_system_prompt()
        self._prepend: list[str] = []
        self._append: list[str] = []

    def _read_system_prompt(self) -> str:
        return (Path(__file__).parent.resolve() / "system.md").read_text()

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
            self._static_system_prompt,
            self._mode.get_mode_prompt(),
            *self._append,
        ]

        return "\n\n".join(part for part in parts if part)
