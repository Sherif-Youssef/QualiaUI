from pydantic import BaseModel, ConfigDict, EmailStr, field_serializer
from datetime import datetime
from enum import Enum
import re

# Tokens

class TokenType(str, Enum):
    ACCESS = "ACCESS"
    REFRESH = "REFRESH"


class TokenPayload(BaseModel):
    user_id: int
    exp: datetime
    iat: datetime
    type: TokenType


class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenResponse(BaseModel):
    access_token: str


# User

class UserBase(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str

    @field_serializer('username')
    def username_valid(cls, v):
        if not v.isidentifier():
            raise ValueError('Username must contain only letters, digits, and underscores')
        return v
    
    @field_serializer('password')
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserRead(UserBase):
    id: int
    is_admin: bool
    
    model_config = ConfigDict(from_attributes=True)
