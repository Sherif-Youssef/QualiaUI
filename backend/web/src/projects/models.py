from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from src.auth.models import User
    from src.testsuites.models import TestSuite


class InvitedRole(str, Enum):
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

class Role(str, Enum):
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"
    OWNER = "OWNER"


class UserProjectLink(SQLModel, table=True):
    user_id: int | None = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    project_id: int | None = Field(foreign_key="project.id", primary_key=True, ondelete="CASCADE")
    role: Role = Field(default=Role.VIEWER)

    user: Optional["User"] = Relationship(back_populates="projects_links")
    project: Optional["Project"] = Relationship(back_populates="users_links")


class Project(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    description: str = Field(default="")
    users_links: list["UserProjectLink"] = Relationship(back_populates="project", cascade_delete=True)
    testsuites: list["TestSuite"] = Relationship(back_populates="project", cascade_delete=True)
