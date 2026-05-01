from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

if TYPE_CHECKING:
    from src.testsuites.models import TestSuite
    from src.runs.models import TestCaseRun


class TestCase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    testsuite_id: int | None = Field(foreign_key="testsuite.id", ondelete="CASCADE")

    name: str
    description: str = Field(default="")
    base_url: str
    instruction: str
    executable_steps: list[dict] | None = Field(default=None, sa_column=Column(JSON))

    testsuite: "TestSuite" = Relationship(back_populates="testcases")

    runs: list["TestCaseRun"] = Relationship(back_populates="testcase")