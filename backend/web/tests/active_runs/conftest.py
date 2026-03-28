import pytest

from automation_engine import (
    TestingEngine,
    EngineConfig,
    BrowserConfig
)
from langchain_openai import ChatOpenAI


@pytest.fixture
def engine():
    llm = ChatOpenAI(
        model="gpt-5-nano-2025-08-07",
        api_key="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"
    )
    return TestingEngine(llm, config=EngineConfig(browser=BrowserConfig(headless=True)))