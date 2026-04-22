import pytest

from automation_engine import (
    TestingEngine,
    EngineConfig,
    BrowserConfig,
    LLMConfig
)

@pytest.fixture
def engine():
    return TestingEngine(
        model="gpt-5-nano-2025-08-07",
        config=EngineConfig(
            browser=BrowserConfig(headless=True),
            llm=LLMConfig(use_screenshot=False, use_tool_calling=True, allow_grouped_steps=True)
        )
    )