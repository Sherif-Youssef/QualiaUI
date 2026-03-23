from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from src.auth.schemas import UserRead

from .models import Role, Project

class UserProjectLinkBase(BaseModel):
	user_id: int
	role: Role

class UserProjectLinkRead(BaseModel):
	user: UserRead
	role: Role
	joined_at: datetime
	model_config = ConfigDict(from_attributes=True)


class UserProjectLinkCreate(UserProjectLinkBase):
	pass


class ProjectBase(BaseModel):
	name: str
	description: str = ""

class ProjectCreate(ProjectBase):
	members: list[UserProjectLinkCreate] = Field(default_factory=list)

class ProjectUpdate(BaseModel):
	name: str | None = None
	description: str | None = None
	members: list[UserProjectLinkCreate] | None = None

class ProjectSummaryRead(ProjectBase):
	id: int
	user_role: Role | None = None

class ProjectRead(ProjectBase):
	id: int
	members: list[UserProjectLinkRead] = Field(default_factory=list, validation_alias="users_links")
	model_config = ConfigDict(from_attributes=True, populate_by_name=True)

