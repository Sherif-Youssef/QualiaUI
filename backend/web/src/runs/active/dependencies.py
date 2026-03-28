from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from automation_engine import TestingEngine, EngineConfig, BrowserConfig
from langchain_openai import ChatOpenAI

from src.config import settings


@lru_cache(maxsize=1)
def get_testing_engine() -> TestingEngine:
    llm = ChatOpenAI(model=settings.LLM_MODEL, api_key=settings.OPENAI_API_KEY)
    return TestingEngine(llm=llm, config=EngineConfig(browser=BrowserConfig(headless=True)))


TestingEngineDep = Annotated[TestingEngine, Depends(get_testing_engine)]
