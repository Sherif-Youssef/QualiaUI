from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING, Optional
from enum import Enum

if TYPE_CHECKING:
    from src.testsuites.models import TestSuite


class TestCase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    testsuite_id: int | None = Field(foreign_key="testsuite.id", ondelete="CASCADE")

    testsuite: Optional["TestSuite"] = Relationship(back_populates="testcases")
    steps: list["TestCaseStep"] = Relationship(back_populates="testcase", cascade_delete=True)

    @property
    def generic_steps(self) -> list["TestCaseStep"]:
        steps = [step for step in self.steps if not step.is_one_step]
        steps.sort(key=lambda step: step.number)
        return steps
    
    @property
    def detailed_step(self) -> list["TestCaseStep"]:
        steps = [step for step in self.steps if step.is_one_step]
        steps.sort(key=lambda step: step.number)
        return steps

class TestCaseStepType(str, Enum):
    GENERIC = "GENERIC"
    INTERACTION = "INTERACTION"
    ASSERTION = "ASSERTION"
    WAITING = "WAITING"


class TestCaseStep(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    number: int
    type: TestCaseStepType
    context: str
    is_one_step: bool
    testcase_id: int | None = Field(foreign_key="testcase.id", ondelete="CASCADE")

    testcase: Optional["TestCase"] = Relationship(back_populates="steps")
