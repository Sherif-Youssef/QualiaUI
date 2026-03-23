from typing import Annotated

from fastapi import APIRouter, Response, status, Cookie, HTTPException

from src.database import SessionDep
from .config import auth_settings
from .dependencies import UserDep
from .schemas import (
    UserRead,
    LoginRequest,
    TokensResponse,
    RefreshTokenResponse,
    UserCreate
)
from .service import (
    authenticate_user,
    create_tokens,
    refresh_tokens,
    register_user
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me", response_model=UserRead)
async def me(user: UserDep):
    return user


@router.post("/tokens", response_model=TokensResponse, name="token")
async def login(
    session: SessionDep,
    login_data: LoginRequest,
    response: Response,
) -> TokensResponse :
    user = authenticate_user(
        session,
        login_data.username,
        login_data.password
    )
    
    tokens = create_tokens(user)

    response.set_cookie(
        key="refresh_token", 
        value=tokens.refresh_token, 
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=auth_settings.JWT_REFRESH_TOKEN_EXPIRATION_MINUTES * 60
    )
    
    return tokens        
    

@router.post("/tokens/refresh", name="refresh_token", response_model=RefreshTokenResponse)
async def refresh(
    session: SessionDep,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> RefreshTokenResponse :
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token.")
    return refresh_tokens(session, refresh_token)
  
    
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    session: SessionDep,
    user_create: UserCreate,
):
    register_user(session, user_create=user_create)
