from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from automation_engine import TestingEngine, EngineConfig, BrowserConfig, LLMConfig

from src.config import settings


@lru_cache(maxsize=1)
def get_testing_engine() -> TestingEngine:
    return TestingEngine(
        model=settings.LLM_MODEL,
        config=EngineConfig(
            browser=BrowserConfig(headless=True),
            llm=LLMConfig(use_screenshot=False, use_tool_calling=True, allow_grouped_steps=True)
        )
    )


TestingEngineDep = Annotated[TestingEngine, Depends(get_testing_engine)]
