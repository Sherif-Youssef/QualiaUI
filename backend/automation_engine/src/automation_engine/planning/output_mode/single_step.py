from __future__ import annotations

from pydantic import BaseModel, Field

from automation_engine.actions import BaseAction, TerminationSignal
from automation_engine.actions.builder import build_output_union
from .base import PlanningMode

from ..action_set.base import ActionSet


class SingleStepMode(PlanningMode):
    """Emit exactly one action or termination per turn."""

    def __init__(self, action_set: ActionSet) -> None:
        super().__init__(action_set)
        self._output_type: type | None = None

    @property
    def name(self) -> str:
        return "single_step"
    
    def _make_single_step_output(self, output_union: type) -> type:
        """Create a PlanningOutput model with a single action/termination output."""

        class SingleStepOutput(BaseModel):
            """Decide the single next action or termination signal."""

            reasoning: str = Field(
                description=(
                    "1-3 sentences: What is the current page state? "
                    "What needs to happen next and why? "
                    "Is the task complete, blocked, or in progress?"
                ),
            )
            output: output_union  # type: ignore[valid-type]

        return SingleStepOutput


    def build_output_type(self) -> type:
        if self._output_type is None:
            combined = build_output_union(self._action_set.actions, self._action_set.terminations)
            self._output_type = self._make_single_step_output(combined)
        return self._output_type

    def get_mode_prompt(self) -> str:
        return (
            "Return exactly **one** action or **one** termination signal per turn.\n\n"
            "After your action is executed, you will receive a fresh observation of the "
            "page before your next turn. Do not anticipate future state — act only on "
            "what you can see now.\n\n"
            "If a prior action failed or the page is in an unexpected state, "
            "terminate with `fail`. Do not retry failed actions."
        )

    def unpack(self, raw: object) -> list[BaseAction] | TerminationSignal:
        output = raw.output
        if isinstance(output, TerminationSignal):
            return output
        return [output]
