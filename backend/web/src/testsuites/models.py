from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.projects.models import Project
    from src.testcases.models import TestCase
    from src.runs.models import TestSuiteRun
    from src.base.models import Cookie

class TestSuite(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    description: str = Field(default="")

    project_id: int = Field(foreign_key="project.id", ondelete="CASCADE")
    project: "Project" = Relationship(back_populates="testsuites")
    testcases: list["TestCase"] = Relationship(back_populates="testsuite", cascade_delete=True)

    runs: list["TestSuiteRun"] = Relationship(back_populates="testsuite", cascade_delete=True)
    cookies: list["Cookie"] = Relationship(back_populates="testsuite", cascade_delete=True)