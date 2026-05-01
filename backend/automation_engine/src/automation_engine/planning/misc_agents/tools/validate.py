"""
automation_engine/injection/tools/validate.py

Semantic validation of a natural language assertion.
"""

from __future__ import annotations

from typing import Type
from pydantic import BaseModel, Field

from .base import BaseTool


class ValidateOutput(BaseModel):
    result: bool = Field(description="Whether the assertion holds true.")
    evidence: str = Field(description="Concrete evidence supporting the result.")
    reasoning: str = Field(description="Short explanation of why the assertion passed or failed.")


class ValidateTool(BaseTool):

    def output_type(self) -> Type[BaseModel]:
        return ValidateOutput

    def system_prompt(self) -> str:
        return (
            "You are a visual/semantic validator. Given a page representation "
            "and an assertion, determine if the assertion is true or false.\n\n"
            "Rules:\n"
            "- Base your judgement only on what is visible in the page representation.\n"
            "- Do not assume content that is not shown.\n"
            "- Explain your reasoning concisely."
        )
