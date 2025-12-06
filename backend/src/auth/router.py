from fastapi import APIRouter, Depends, Response, status, Cookie, Body
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from .service import AuthService
from .schemas import *
from .config import auth_settings
from .service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/tokens", response_model=TokensResponse, name="token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    response: Response,
    auth_service: Annotated[AuthService, Depends()],
) -> TokensResponse :
    user = auth_service.authenticate_user(
        form_data.username, 
        form_data.password
    )
    
    tokens = auth_service.create_tokens(user)

    response.set_cookie(
        key="refresh_token", 
        value=tokens.refresh_token, 
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=auth_settings.JWT_REFRESH_TOKEN_EXPIRATION_MINUTES * 60
    )
    
    return tokens
        
    
@router.post("/tokens/refresh", name="refresh_token")
async def refresh_tokens(
    auth_service: Annotated[AuthService, Depends()],
    refresh_token: Annotated[str, Cookie()], 
) -> RefreshTokenResponse :
    return auth_service.refresh_tokens(refresh_token)
    

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_create: UserCreate,
    auth_service: Annotated[AuthService, Depends()],
    response: Response
) -> UserRead:
    user = auth_service.register_user(user_create=user_create)
    response.headers["Location"] = f"/users/{user.id}"
    return user
