from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from automation_engine import TestingEngine, EngineConfig, BrowserConfig
from langchain_openai import ChatOpenAI

from src.config import settings
from src.database import get_session
from .manager import RunManager


@lru_cache(maxsize=1)
def _get_engine() -> TestingEngine:
    llm = ChatOpenAI(model=settings.LLM_MODEL, api_key=settings.OPENAI_API_KEY)
    return TestingEngine(llm=llm, config=EngineConfig(browser=BrowserConfig(headless=True)))


@lru_cache(maxsize=1)
def _get_run_manager() -> RunManager:
    return RunManager(
        engine=_get_engine(),
        session_factory=get_session,
    )


def get_run_manager() -> RunManager:
    return _get_run_manager()


RunManagerDep = Annotated[RunManager, Depends(get_run_manager)]