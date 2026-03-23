from datetime import datetime, timedelta
import logging

from fastapi import HTTPException, status
from sqlmodel import Session
from passlib.context import CryptContext
import jwt

from src.config import timezone
from .config import auth_settings
from .models import (
    User, Role
)
from .schemas import (
    UserCreate,
    
    TokenType,
    TokenPayload,
    RefreshTokenResponse,
    TokensResponse
)
from .exceptions import (
    TokenError,
    InvalidTokenError,
    InvalidTokenTypeError,
    ExpiredTokenError
)
from .queries import (
    get_by_id,
    get_by_username_or_email,
    exists_by_username,
    exists_by_email,
)

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["argon2"])
DUMMY_PASSWORD_HASH = pwd_context.hash("qualia_dummy_password")

# Passwords

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Tokens

def create_token(user_id: int, token_type: TokenType, expires_delta: timedelta) -> str:
    time_now = datetime.now(tz=timezone)
    payload = TokenPayload(
        user_id=user_id,
        exp=time_now + expires_delta,
        iat=time_now,
        type=token_type,
    )
    return jwt.encode(
        payload.model_dump(), 
        auth_settings.JWT_SECRET_KEY, 
        algorithm=auth_settings.JWT_ALGORITHM
    )

def decode_token(token: str, expected_type: TokenType | None = None) -> TokenPayload:
    try:
        payload_data = jwt.decode(token, auth_settings.JWT_SECRET_KEY, algorithms=[auth_settings.JWT_ALGORITHM])
        payload = TokenPayload(**payload_data)
        if expected_type and expected_type != payload.type:
            raise InvalidTokenTypeError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise ExpiredTokenError("Token is expired")
    except jwt.InvalidTokenError:
        raise InvalidTokenError("Invalid token")
    
# Auth

def register_user(session: Session, user_create: UserCreate) -> User:
    if exists_by_username(
        session=session,
        username=user_create.username
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username already exists"
        )
    
    if exists_by_email(
        session=session,
        email=user_create.email
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = User(
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        username=user_create.username,
        email=user_create.email,
        hashed_password=hash_password(user_create.password),
    )

    session.add(user)
    session.flush()
    session.commit()

    return user

def authenticate_user(session: Session, username_or_email: str, password: str) -> User:
    user = get_by_username_or_email(session, username_or_email)
    
    if not user:
        verify_password(password, DUMMY_PASSWORD_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Inactive user"
        )
        
    return user

def create_tokens(user: User) -> TokensResponse:
    access_token = create_token(
        user_id=user.id, # pyright: ignore[reportArgumentType]
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=auth_settings.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES)
    )
    refresh_token = create_token(
        user_id=user.id, # pyright: ignore[reportArgumentType]
        token_type=TokenType.REFRESH,
        expires_delta=timedelta(minutes=auth_settings.JWT_REFRESH_TOKEN_EXPIRATION_MINUTES)
    )
    return TokensResponse(access_token=access_token, refresh_token=refresh_token)

def refresh_tokens(session: Session, refresh_token: str) -> RefreshTokenResponse:
    try:
        payload = decode_token(refresh_token, TokenType.REFRESH)
    except TokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        
    user = get_by_id(session, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
        
    if not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user.")

    access_token = create_token(
        user_id=user.id,  # pyright: ignore[reportArgumentType]
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=auth_settings.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES),
    )
    return RefreshTokenResponse(access_token=access_token)


def is_admin(user: User) -> bool:
    return user.role == Role.ADMIN