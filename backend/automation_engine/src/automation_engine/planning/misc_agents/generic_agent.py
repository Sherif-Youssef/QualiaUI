
from __future__ import annotations

import logging
from typing import Callable

from pydantic_ai import Agent, PromptedOutput

from .tools.base import BaseTool

logger = logging.getLogger(__name__)


class GenericAgent:

    def __init__(
        self,
        default_model: str,
        tool: BaseTool,
        *,
        use_tool_calling: bool = True,
        additional_tools: list[Callable] | None = None
    ) -> None:
        self._tool = tool
        output_type = tool.output_type()

        self._agent = Agent(
            model=default_model,
            system_prompt=tool.system_prompt(),
            output_type=(
                output_type
                if use_tool_calling
                else PromptedOutput(output_type)
            ),
            tools=additional_tools or [],
        )

        logger.info(
            "GenericAgent initialized: tool=%s, tool_calling=%s",
            type(tool).__name__,
            use_tool_calling,
        )

    async def run(
        self,
        page_repr: str,
        task: str,
        *,
        model: str | None = None,
    ) -> object:
        user_message = (
            f"## Page\n```\n{page_repr}\n```\n\n"
            f"## Task\n{task}"
        )
        result = await self._agent.run(user_message, model=model)
        return result.output
