from datetime import datetime
from enum import Enum
import re

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from .models import Role

############################################################
# Tokens
############################################################

class TokenType(str, Enum):
    ACCESS = "ACCESS"
    REFRESH = "REFRESH"


class TokenPayload(BaseModel):
    user_id: int
    exp: datetime
    iat: datetime
    type: TokenType


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokensResponse(RefreshTokenResponse):
    refresh_token: str
    must_change_password: bool = False
    

class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_valid(cls, v):
        from .service import validate_password
        validate_password(v) 
        return v
############################################################
# User
############################################################


class UserBase(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
 
 
class UserCreate(UserBase):
    role: Role = Role.VIEWER
    is_active: bool = True
 
    @field_validator('username')
    @classmethod
    def username_valid(cls, v):     
        from .service import validate_username
        validate_username(v)
        return v


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    email: EmailStr | None = None

    @field_validator('username')
    @classmethod
    def username_valid(cls, v):
        if v is None:
            return v
        from .service import validate_username
        validate_username(v)
        return v

class AdminUserUpdate(UserUpdate):
    role: Role | None = None
    is_active: bool | None = None
 
class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: Role
    model_config = ConfigDict(from_attributes=True)

class AdminUserRead(UserRead):
    is_active: bool
    is_temp_pass: bool

class ProvisionedUserRead(AdminUserRead):
    temporary_password: str
