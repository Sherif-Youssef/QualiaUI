from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from src.projects.models import Project

class TestSuite(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    project_id: int | None = Field(foreign_key="project.id", ondelete="CASCADE")

    project: Optional["Project"] = Relationship(back_populates="testsuites")