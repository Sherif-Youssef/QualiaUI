from typing import Annotated

from fastapi import APIRouter, Depends, Response, status, Cookie, HTTPException, Query

from src.base.schemas import Page, PaginationParams
from src.database import SessionDep
from .config import auth_settings
from .dependencies import AdminUserDep, PasswordChangeRequiredUserDep, UserDep
from .models import Role
from .schemas import (
    AdminUserUpdate,
    AdminUserRead,
    UserUpdate,
    UserRead,
    LoginRequest,
    TokensResponse,
    RefreshTokenResponse,
    UserCreate,
    ChangePasswordRequest,
    ProvisionedUserRead,
)
from .service import (
    authenticate_user,
    change_password,
    create_user_with_temp_pass,
    create_tokens,
    delete_user,
    get_user,
    list_users,
    regenerate_temporary_password,
    refresh_tokens,
    update_user,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
users_router = APIRouter(prefix="/users", tags=["users"])



@auth_router.get("/me", response_model=UserRead)
async def me_route(user: PasswordChangeRequiredUserDep):
    return user

@auth_router.post("/tokens", response_model=TokensResponse, name="token")
async def login_route(
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
    
@auth_router.post("/tokens/refresh", name="refresh_token", response_model=RefreshTokenResponse)
async def refresh_route(
    session: SessionDep,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> RefreshTokenResponse :
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token.")
    return refresh_tokens(session, refresh_token)


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_route(
    response: Response,
) -> Response:
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="lax",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@auth_router.post("/users/{user_id}/temporary-password/regenerate", response_model=ProvisionedUserRead)
async def regenerate_temporary_password_route(
    session: SessionDep,
    _: AdminUserDep,
    user_id: int,
) -> ProvisionedUserRead:
    user, temporary_password = regenerate_temporary_password(
        session=session,
        user_id=user_id,
    )
    return ProvisionedUserRead(
        id=user.id,  # pyright: ignore[reportArgumentType]
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        temporary_password=temporary_password,
        is_temp_pass=True
    )


@auth_router.post("/password/change", status_code=status.HTTP_204_NO_CONTENT)
async def change_password_route(
    session: SessionDep,
    user: PasswordChangeRequiredUserDep,
    payload: ChangePasswordRequest,
) -> Response:
    change_password(
        session=session,
        user=user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@users_router.post("", status_code=status.HTTP_201_CREATED, response_model=ProvisionedUserRead)
async def create_user_route(
    session: SessionDep,
    _: AdminUserDep,
    user_create: UserCreate,
) -> ProvisionedUserRead:
    created_user, temporary_password = create_user_with_temp_pass(
        session=session,
        user_create=user_create,
    )
    return ProvisionedUserRead(
        id=created_user.id,  # pyright: ignore[reportArgumentType]
        first_name=created_user.first_name,
        last_name=created_user.last_name,
        username=created_user.username,
        email=created_user.email,
        role=created_user.role,
        is_active=created_user.is_active,
        temporary_password=temporary_password,
        is_temp_pass=True
    )


@users_router.get("", response_model=Page[AdminUserRead] | Page[UserRead])
async def list_users_route(
    session: SessionDep,
    user: UserDep,
    pagination_params: PaginationParams = Depends(),
    email: Annotated[str | None, Query()] = None,
    username: Annotated[str | None, Query()] = None,
    role: Role | None = None,
    is_active: bool | None = None,
    is_temp_pass: bool | None = None,
) -> Page[AdminUserRead] | Page[UserRead]:
    page = list_users(
        session=session,
        current_user=user,
        pagination_params=pagination_params,
        email=email,
        username=username,
        role=role,
        is_active=is_active,
        is_temp_pass=is_temp_pass,
    )
    if user.role == Role.ADMIN:
        return Page[AdminUserRead](
            total_items=page.total_items,
            items=[AdminUserRead.model_validate(item, from_attributes=True) for item in page.items],
            offset=page.offset,
            limit=page.limit,
        )

    return Page[UserRead](
        total_items=page.total_items,
        items=[UserRead.model_validate(item, from_attributes=True) for item in page.items],
        offset=page.offset,
        limit=page.limit,
    )


@users_router.get("/{user_id}", response_model=AdminUserRead | UserRead)
async def get_user_route(
    session: SessionDep,
    user: UserDep,
    user_id: int,
) -> AdminUserRead | UserRead:
    target_user = get_user(session=session, current_user=user, user_id=user_id)
    if user.role == Role.ADMIN:
        return AdminUserRead.model_validate(target_user, from_attributes=True)
    return UserRead.model_validate(target_user, from_attributes=True)


@users_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_route(
    session: SessionDep,
    _: AdminUserDep,
    user_id: int,
) -> Response:
    delete_user(session=session, user_id=user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@users_router.put("/{user_id}", response_model=AdminUserRead | UserRead)
async def update_user_route(
    session: SessionDep,
    user: UserDep,
    user_id: int,
    payload: AdminUserUpdate | UserUpdate,
) -> AdminUserRead | UserRead:
    updated_user = update_user(
        session=session,
        current_user=user,
        user_id=user_id,
        payload=payload,
    )

    if user.role == Role.ADMIN:
        return AdminUserRead.model_validate(updated_user, from_attributes=True)
    return UserRead.model_validate(updated_user, from_attributes=True)



router = APIRouter()
router.include_router(auth_router)
router.include_router(users_router)