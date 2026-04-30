from datetime import datetime
from typing import TYPE_CHECKING, Literal

from sqlalchemy import Column, Enum as SAEnum
from sqlmodel import Field, Relationship, SQLModel
from src.base.schemas import RoleEnum

if TYPE_CHECKING:
	from src.auth.models import User
	from src.testsuites.models import TestSuite
	from src.runs.models import ProjectRun


class Role(RoleEnum):
	VIEWER = ("viewer", 1)
	EDITOR = ("editor", 2)
	ADMIN = ("admin", 3)


class UserProjectLink(SQLModel, table=True):
	user_id: int | None = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
	project_id: int | None = Field(foreign_key="project.id", primary_key=True, ondelete="CASCADE")
	role: Role = Field(
		default=Role.VIEWER,
		# sa_column=Column(
		# 	SAEnum(
		# 		Role,
		# 		values_callable=lambda enum_cls: [member.value for member in enum_cls],
		# 		# native_enum=False,
		# 	),
		# 	nullable=False,
		# ),
	)
	joined_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)

	user: "User" = Relationship(back_populates="projects_links")
	project: "Project" = Relationship(back_populates="users_links")


class Project(SQLModel, table=True):
	id: int | None = Field(default=None, primary_key=True)
	name: str
	description: str = Field(default="")
	users_links: list[UserProjectLink] = Relationship(back_populates="project", cascade_delete=True)
	testsuites: list["TestSuite"] = Relationship(back_populates="project", cascade_delete=True)
	runs: list["ProjectRun"] = Relationship(back_populates="project")