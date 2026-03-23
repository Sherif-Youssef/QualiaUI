from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from src.testcases.models import TestCaseStep


class Construct(SQLModel, table=True):
    
    id: int | None = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", ondelete="CASCADE")

    name: str
    description: str = Field(default="")
    steps: list["TestCaseStep"] = Relationship(back_populates="construct", cascade_delete=True)
    always_build: bool = Field(default=False)

    ref_by: list["TestCaseStep"] = Relationship(back_populates="ref_construct", cascade_delete=True)
