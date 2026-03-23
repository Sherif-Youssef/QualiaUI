from typing import TYPE_CHECKING

from sqlmodel import Field, SQLModel, Relationship

from src.base.schemas import RoleEnum


if TYPE_CHECKING:
    from src.projects.models import UserProjectLink, Project


class Role(RoleEnum):
	VIEWER = ("viewer", 1)
	EDITOR = ("editor", 2)
	ADMIN = ("admin", 3)


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    username: str
    email: str
    hashed_password: str
    is_active: bool = Field(default=True)
    role: Role = Field(default=Role.VIEWER)

    projects_links: list["UserProjectLink"] = Relationship(
        back_populates="user",
        cascade_delete=True,
    )

    @property
    def projects(self) -> list["Project"]:
        return [link.project for link in self.projects_links]
    