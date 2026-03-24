from datetime import datetime, timedelta
import logging
import secrets
import string
import re

from fastapi import HTTPException, status
from sqlmodel import Session
from passlib.context import CryptContext
import jwt

from src.base.schemas import Page, PaginationParams
from src.config import timezone
from .models import (
    User, Role, ADMIN_FIELDS, NON_ADMIN_FIELDS
)
from .schemas import (
    AdminUserUpdate,
    AdminUserRead,
    UserCreate,
    UserUpdate,

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
    list_users as list_users_query,
)

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["argon2"])
DUMMY_PASSWORD_HASH = pwd_context.hash("qualia_dummy_password")
SPECIAL_CHARS = r'!@#$%^&*(),.?":{}|<>'
MIN_LENGTH = 8
MAX_LENGTH = 128

def _get_auth_settings():
    from .config import auth_settings
    return auth_settings

# Passwords

def validate_password(password: str) -> None:
    if len(password) < MIN_LENGTH:
        raise ValueError(f'Password must be at least {MIN_LENGTH} characters long')
    if len(password) > MAX_LENGTH:
        raise ValueError(f'Password must be at most {MAX_LENGTH} characters long')
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter')
    if not re.search(r'\d', password):
        raise ValueError('Password must contain at least one digit')
    if not re.search(f'[{re.escape(SPECIAL_CHARS)}]', password):
        raise ValueError('Password must contain at least one special character')

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def generate_temporary_password(length: int = 12) -> str:
    if length < 8:
        raise ValueError("Length must be at least 8.")

    alphabet_upper = string.ascii_uppercase
    alphabet_lower = string.ascii_lowercase
    digits = string.digits
    specials = "!@#$%^&*()"

    password_chars = [
        secrets.choice(alphabet_upper),
        secrets.choice(alphabet_lower),
        secrets.choice(digits),
        secrets.choice(specials),
    ]

    all_chars = alphabet_upper + alphabet_lower + digits + specials
    password_chars += [secrets.choice(all_chars) for _ in range(length - 4)]

    secrets.SystemRandom().shuffle(password_chars)
    return ''.join(password_chars)

# Username

def validate_username(username: str):
    if username == "":
        raise ValueError("Username cannot be blank.")
    
    if len(username) > 20:
        raise ValueError("Username must be at most 20 characters long")

    if username[0].isdigit():
        raise ValueError("Username cannot start with a digit")

    if not re.match(r'^\w+$', username):
        raise ValueError(
            'Username must contain only letters, digits, and underscores'
        )


# Tokens

def create_token(user_id: int, token_type: TokenType, expires_delta: timedelta) -> str:
    auth_settings = _get_auth_settings()
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
    auth_settings = _get_auth_settings()
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

def _check_uniqueness(session: Session, username: str | None, email: str | None, with_raise: bool = True) -> bool:
    if username and exists_by_username(
        session=session,
        username=username
    ):
        if with_raise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )
        return False

    if email and exists_by_email(
        session=session,
        email=email
    ):
        if with_raise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        return False

    return True

def create_user(
    session: Session, 
    user_create: UserCreate,
    password: str,
    is_temp_pass: bool
) -> User:
    _check_uniqueness(
        session=session, 
        username=user_create.username, 
        email=user_create.email, 
        with_raise=True
    )
    user = User(
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        username=user_create.username,
        email=user_create.email,
        hashed_password=hash_password(password),
        role=user_create.role,
        is_active=user_create.is_active,
        is_temp_pass=is_temp_pass,
    )

    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def create_user_with_temp_pass(session: Session, user_create: UserCreate) -> tuple[User, str]:
    temporary_password = generate_temporary_password()
    return create_user(
        session=session, 
        user_create=user_create, 
        password=temporary_password,
        is_temp_pass=True
    ), temporary_password


def get_user(session: Session, current_user: User, user_id: int) -> User:
    user = get_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role != Role.ADMIN and not user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


def delete_user(session: Session, user_id: int) -> None:
    user = get_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    session.delete(user)
    session.commit()


def update_user(
    session: Session,
    current_user: User,
    user_id: int,
    payload: AdminUserUpdate | UserUpdate,
) -> User:
    user = get_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if current_user.role != Role.ADMIN and user != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have enough permissions",
        )

    allowed_fields = ADMIN_FIELDS if current_user.role == Role.ADMIN else NON_ADMIN_FIELDS

    for field, value in payload.model_dump(exclude_none=True).items():
        if field in allowed_fields:
            setattr(user, field, value)

    session.commit()
    session.refresh(user)

    return user

def list_users(
    session: Session,
    current_user: User,
    pagination_params: PaginationParams,
    email: str | None = None,
    username: str | None = None,
    role: Role | None = None,
    is_active: bool | None = None,
    is_temp_pass: bool | None = None,
) -> Page[User]:
    if current_user.role == Role.ADMIN:
        users, total_items = list_users_query(
            session=session,
            email=email,
            username=username,
            role=role,
            is_active=is_active,
            is_temp_pass=is_temp_pass,
            offset=pagination_params.offset,
            limit=pagination_params.limit,
        )
    else:
        users, total_items = list_users_query(
            session=session,
            email=email,
            username=username,
            role=role,
            is_active=True,
            is_temp_pass=None,
            offset=pagination_params.offset,
            limit=pagination_params.limit,
        )

    return Page[User](
        total_items=total_items,
        items=users,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
    )


def regenerate_temporary_password(session: Session, user_id: int) -> tuple[User, str]:
    user = get_by_id(session, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_temp_pass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temporary password can be regenerated only before the user changes password",
        )

    temporary_password = generate_temporary_password()
    user.hashed_password = hash_password(temporary_password)
    session.add(user)
    session.commit()
    session.refresh(user)

    return user, temporary_password

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
    auth_settings = _get_auth_settings()
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
    return TokensResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        must_change_password=user.is_temp_pass,
    )


def change_password(session: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    if verify_password(new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    user.hashed_password = hash_password(new_password)
    if user.is_temp_pass:
        user.is_temp_pass = False
    session.add(user)
    session.commit()

def refresh_tokens(session: Session, refresh_token: str) -> RefreshTokenResponse:
    auth_settings = _get_auth_settings()
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