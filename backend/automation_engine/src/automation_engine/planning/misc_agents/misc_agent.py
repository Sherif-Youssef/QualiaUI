from __future__ import annotations

from typing import Any
from pydantic import BaseModel

from .generic_agent import GenericAgent
from .tools.validate import ValidateTool, ValidateOutput
from .tools.extract import ExtractStructuredDataTool
from playwright.async_api import Page
from pydantic_ai import BinaryContent


class MiscAgent:
    
    def __init__(self, default_model: str, use_tool_calling: bool = True):
        self._validation_agent = GenericAgent(
            default_model=default_model,
            use_tool_calling=use_tool_calling,
            tool=ValidateTool(),
            additional_tools=[self._screenshot]
        )
        self._use_tool_calling = use_tool_calling
        self._default_model = default_model
        self._page: Page | None = None

    async def validate(self, page: Page, assertion: str, context: str | None = None, *, model: str | None = None) -> ValidateOutput:
        self._page = page
        page_repr = await page.locator("body").aria_snapshot()
        task = f"Assert the following: {assertion}"
        if context:
            task += f"\n Context: {context}"
        output = await self._validation_agent.run(page_repr, task, model=model)
        self._page = None
        return output

    async def extract(self, page: Page, description: str, schema: str | BaseModel, *, many: bool = False, model: str | None = None) -> Any:
        agent = GenericAgent(
            default_model=self._default_model,
            use_tool_calling=self._use_tool_calling,
            tool=ExtractStructuredDataTool(schema, many=many),
        )
        page_repr = await page.locator("body").aria_snapshot()
        output = await agent.run(page_repr, description, model=model)
        return output.data

    async def _screenshot(self):
        """Get a screenshot of the current page. Only use when visual validation is needed"""
        image = await self._page.screenshot(type="png")
        return BinaryContent(data=image, media_type="image/png")
