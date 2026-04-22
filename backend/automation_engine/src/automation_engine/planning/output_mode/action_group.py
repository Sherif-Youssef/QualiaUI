from __future__ import annotations

from pydantic import BaseModel, Field

from automation_engine.actions import BaseAction, TerminationSignal
from automation_engine.actions.builder import build_action_union, build_termination_union

from ..action_set.base import ActionSet
from .base import PlanningMode


class ActionGroupMode(PlanningMode):
    """Emit a batch of actions executable without re-observation, or terminate."""

    def __init__(self, action_set: ActionSet) -> None:
        super().__init__(action_set)
        self._output_type: type | None = None

    @property
    def name(self) -> str:
        return "action_group"
    
    def _make_group_output(self, action_union: type, term_union: type) -> type:
        """Create a PlanningOutput model with a list of actions OR a termination signal."""

        class GroupOutput(BaseModel):
            """Decide the next group of actions or a termination signal."""

            reasoning: str = Field(
                description=(
                    "1-3 sentences: What is the current page state? "
                    "What group of actions can be safely executed without "
                    "re-observing the page? Why these together?"
                ),
            )
            actions: list[action_union] | None = Field(  # type: ignore[valid-type]
                default=None,
                description="Ordered list of actions to execute sequentially. Null if terminating.",
            )
            termination: term_union | None = Field(  # type: ignore[valid-type]
                default=None,
                description="Termination signal. Null if emitting actions.",
            )

        return GroupOutput


    def build_output_type(self) -> type:
        if self._output_type is None:
            action_union = build_action_union(self._action_set.actions)
            term_union = build_termination_union(self._action_set.terminations)
            self._output_type = self._make_group_output(action_union, term_union)
        return self._output_type

    def get_mode_prompt(self) -> str:
        return (
            "Return either:\n"
            "- A **list of actions** in `actions` (set `termination` to null), or\n"
            "- A **termination signal** in `termination` (set `actions` to null).\n\n"
            "### Grouping Rules\n\n"
            "**Group together** when:\n"
            "- All targets are currently visible and stable in the DOM.\n"
            "- No action in the group triggers a navigation or major re-render.\n"
            "- Actions are logically sequential (e.g., fill multiple form fields).\n\n"
            "**Keep separate** (return fewer actions) when:\n"
            "- An action triggers navigation, a modal, or a dynamic re-render.\n"
            "- The next action depends on the result or side-effect of the current one.\n"
            "- You are unsure whether a target will still exist after a prior action.\n\n"
            "Verify every `target_id` exists in the current DOM before including it.\n"
            "When in doubt, return fewer actions — you will get another turn."
        )

    def unpack(self, raw: object) -> list[BaseAction] | TerminationSignal:
        if raw.termination is not None:
            return raw.termination
        if raw.actions:
            return raw.actions
        raise ValueError("Agent returned neither actions nor termination.")
