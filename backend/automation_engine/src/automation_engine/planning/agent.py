from __future__ import annotations

import logging
import logfire
from pathlib import Path
from typing import Any

from pydantic_ai import Agent, BinaryContent, PromptedOutput

from automation_engine.actions import BaseAction, TerminationSignal

from .deps import PlanningDeps
from .output_mode.base import PlanningMode
from .prompt.builder import PromptBuilder
from .state import ModelState


# For ovservability
logfire.configure()
logfire.instrument_pydantic_ai()

logger = logging.getLogger(__name__)

UserMessage = str | list[str | BinaryContent]
PlanningOutput = list[BaseAction] | TerminationSignal


class PlanningAgent:
    """
    Thin wrapper over pydantic-ai Agent, configured by a PlanningMode.
    """

    def __init__(
        self,
        mode: PlanningMode,
        *,
        default_model: str | None = None,
        use_tool_calling: bool = True,
        extra_prompt_sections: list[str] | None = None,
    ) -> None:
        self._mode = mode
        self._default_model = default_model
        self._use_tool_calling = use_tool_calling

        self._agent = self._build_agent(mode, default_model, extra_prompt_sections)

        logger.info(
            "PlanningAgent initialized: mode=%s, tool_calling=%s, "
            "actions=%d, model=%s",
            mode.name,
            use_tool_calling,
            len(mode.action_set.actions),
            default_model,
        )

    @property
    def mode(self) -> PlanningMode:
        return self._mode

    @property
    def use_tool_calling(self) -> bool:
        return self._use_tool_calling

    async def run(
        self,
        state: ModelState,
        *,
        model: str | None = None,
    ) -> PlanningOutput:
        """
        Run a single planning turn.

        Args:
            state: Current page state, instruction, and history.
            model: Override the default model for this call.

        Returns:
            A list of actions to execute, or a termination signal.
        """
        deps = PlanningDeps(input_state=state, mode=self._mode)
        user_message = self._build_user_message(state)

        result = await self._agent.run(user_message, deps=deps, model=model)
        output = self._mode.unpack(result.output)

        if isinstance(output, TerminationSignal):
            logger.info("Agent terminated: %s", output.termination_type)
        else:
            logger.info("Agent emitted %d action(s)", len(output))
        return output

    def _build_agent(
        self,
        mode: PlanningMode,
        default_model: str | None,
        extra_sections: list[str] | None,
    ) -> Agent[PlanningDeps, Any]:
        prompt_builder = PromptBuilder(mode)
        for section in extra_sections or []:
            prompt_builder.append(section)
        
        output_type = mode.build_output_type()
        system_prompt = prompt_builder.build()

        if self._use_tool_calling:
            return Agent(
                model=default_model,
                output_type=output_type,
                system_prompt=system_prompt,
                deps_type=PlanningDeps,
            )

        return Agent(
            model=default_model,
            output_type=PromptedOutput(output_type),
            system_prompt=system_prompt,
            deps_type=PlanningDeps,
        )

    @staticmethod
    def _build_user_message(state: ModelState) -> UserMessage:
        """Build user-message content, optionally including a screenshot."""
        sections = [
            f"## Task\n{state.instruction}",
            f"\n\n## Current Page\n```\n{state.page}\n```",
        ]

        if state.history:
            sections.append(f"\n\n## Action History\n{state.history}")

        sections.append("\n\nAnalyze the current state and decide your next action.")
        text = "".join(sections)

        if state.screenshot is None:
            return text

        screenshot = state.screenshot
        if isinstance(screenshot, Path):
            screenshot = screenshot.read_bytes()

        return [text, BinaryContent(data=screenshot, media_type="image/png")]
