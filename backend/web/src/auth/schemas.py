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
    

class LoginRequest(BaseModel):
    username: str
    password: str

############################################################
# User
############################################################


class UserBase(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
 
 
class UserCreate(UserBase):
    password: str
 
    @field_validator('username')
    @classmethod
    def username_valid(cls, v):     
        if v == "":
            raise ValueError("Username cannot be blank.")
        
        if len(v) > 20:
            raise ValueError("Username must be at most 20 characters long")

        if v[0].isdigit():
            raise ValueError("Username cannot start with a digit")

        if not re.match(r'^\w+$', v):
            raise ValueError(
                'Username must contain only letters, digits, and underscores'
            )

        return v
 
    @field_validator('password')
    @classmethod
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 128:
            raise ValueError('Password must be at most 128 characters long')
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
    role: Role
    model_config = ConfigDict(from_attributes=True)