from sqlmodel import Field, SQLModel, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.projects.models import UserProjectLink, Project

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    username: str
    email: str
    hashed_password: str
    is_active: bool = Field(default=True)
    is_admin: bool = Field(default=False)

    projects_links: list["UserProjectLink"] = Relationship(cascade_delete=True)

    @property
    def projects(self) -> list["Project"]:
        return [link.project for link in self.projects_links]
    