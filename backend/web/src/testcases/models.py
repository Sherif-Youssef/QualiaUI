from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

if TYPE_CHECKING:
    from src.testsuites.models import TestSuite
    from src.construct.models import Construct


class TestCase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    testsuite_id: int | None = Field(foreign_key="testsuite.id", ondelete="CASCADE")

    name: str
    description: str = Field(default="")
    base_url: str

    testsuite: "TestSuite" = Relationship(back_populates="testcases")
    steps: list["TestCaseStep"] = Relationship(back_populates="testcase", cascade_delete=True)


class TestCaseStep(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    index: int

    # TOP LEVEL
    testcase_id: int | None = Field(foreign_key="testcase.id", ondelete="CASCADE")
    testcase: "TestCase" = Relationship(back_populates="steps")

    construct_id: int | None = Field(foreign_key="construct.id", ondelete="CASCADE")
    construct: "Construct" = Relationship(back_populates="steps")

    # BOTTOM LEVEL
    instruction: str | None = Field(default=None)
    executable_steps: list[dict] | None = Field(default=None, sa_column=Column(JSON))

    ref_construct_id: int | None = Field(default=None, foreign_key="construct.id", ondelete="RESTRICT")
    ref_construct: "Construct" = Relationship(back_populates="ref_by")
