from pydantic import BaseModel, Field, field_validator
from .models import Role, InvitedRole
from src.auth.schemas import UserRead


class UserProjectLinkRead(BaseModel):
    role: Role
    user: UserRead


class UserProjectLinkCreate(BaseModel):
    role: InvitedRole
    user_id: int


class ProjectBase(BaseModel):
    name: str
    description: str


class ProjectCreate(ProjectBase):
    ...


class ProjectRead(ProjectBase):
    id: int
    members: list[UserProjectLinkRead] = Field(alias="users_links")


class ProjectUpdate(BaseModel):
    name: str | None
    description: str | None
