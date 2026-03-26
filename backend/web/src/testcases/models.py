from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

from src.testsuites.models import TestSuite


class TestCase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    testsuite_id: int | None = Field(foreign_key="testsuite.id", ondelete="CASCADE")

    name: str
    description: str = Field(default="")
    base_url: str
    instruction: str
    executable_steps: list[dict] | None = Field(default=None, sa_column=Column(JSON))

    testsuite: TestSuite = Relationship(back_populates="testcases")