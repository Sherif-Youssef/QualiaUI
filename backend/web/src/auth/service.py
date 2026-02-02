from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from src.config import timezone
import logging
from typing import Annotated
from .config import auth_settings
from .models import *
from .schemas import *
from .exceptions import *
from .repository import UserRepository


logger = logging.getLogger(__name__)


class PasswordService:
    pwd_context = CryptContext(schemes=["argon2"])

    @staticmethod
    def hash_password(password: str) -> str:
        return PasswordService.pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return PasswordService.pwd_context.verify(plain_password, hashed_password)

class JWTService:
    @staticmethod
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
    @staticmethod
    def decode_token(token: str, expected_type: TokenType = None) -> TokenPayload:
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

class AuthService:
    def __init__(
            self, 
            user_repository: Annotated[UserRepository, Depends()], 
        ):
        self.user_repository = user_repository

    def register_user(self, user_create: UserCreate) -> User:
        if self.user_repository.exists_by_username(
            username=user_create.username
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )
        
        if self.user_repository.exists_by_email(
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
            hashed_password=PasswordService.hash_password(user_create.password),
        )

        return self.user_repository.save(user)

    def authenticate_user(self, username_or_email: str, password: str) -> User:
        user = self.user_repository.get_by_username_or_email(username_or_email)
        
        if not user:
            PasswordService.verify_password(
                "password", "846325781ee9cdd27eccb7c40e73ab1d8c67726727e4dccb1df5abf2d98435cba118faaa82c9e0a59b794b982dc86dac6806c4e7f672a8201581d774c8f8b447"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not PasswordService.verify_password(password, user.hashed_password):
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

    def create_tokens(self, user: User) -> TokensResponse:
        access_token = JWTService.create_token(
            user_id=user.id,
            token_type=TokenType.ACCESS,
            expires_delta=timedelta(minutes=auth_settings.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES)
        )
        refresh_token = JWTService.create_token(
            user_id=user.id,
            token_type=TokenType.REFRESH,
            expires_delta=timedelta(minutes=auth_settings.JWT_REFRESH_TOKEN_EXPIRATION_MINUTES)
        )
        return TokensResponse(access_token=access_token, refresh_token=refresh_token)

    def refresh_tokens(self, refresh_token: str) -> RefreshTokenResponse:
        try:
            payload = JWTService.decode_token(refresh_token)
            if payload.type != TokenType.REFRESH:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
        except TokenError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
            
        user = self.user_repository.get_by_id(payload.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
            
        if not user.is_active:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user.")

        return self.create_tokens(user)