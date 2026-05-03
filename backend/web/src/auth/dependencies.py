from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Header, status, Query

from src.database import SessionDep
from .service import decode_token
from .models import User, Role
from .schemas import TokenType
from .queries import get_by_id
from .exceptions import TokenError


async def require_auth_token(
    authorization: Annotated[str | None, Header()] = None,
    token_query: Annotated[str | None, Query(alias="token")] = None,
) -> str:
    final_token: str | None = None

    if authorization:
        try:
            scheme, header_token = authorization.split(maxsplit=1)
            if scheme.lower() == "bearer":
                final_token = header_token.strip()
        except (ValueError, AttributeError):
            pass
    
    if not final_token:
        final_token = token_query

    if not final_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Missing authorization."
        )

    return final_token


# require_active_user -> require_auth_token
async def require_active_user(
    session: SessionDep,
    token: Annotated[str, Depends(require_auth_token)],
) -> User:
    try:
        payload = decode_token(token, expected_type=TokenType.ACCESS)
    except TokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
    user = get_by_id(session, payload.user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


# require_non_temporary_password -> require_active_user -> require_auth_token
async def require_non_temporary_password(
    user: Annotated[User, Depends(require_active_user)],
) -> User:
    if user.is_temp_pass:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required",
        )
    return user


# require_role -> require_non_temporary_password -> require_active_user -> require_auth_token
def require_role(required_role: Role) -> Callable[..., Awaitable[User]]:
    async def role_checker(
        user: Annotated[User, Depends(require_non_temporary_password)],
    ) -> User:
        if user.role < required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have enough permissions",
            )
        return user
    return role_checker


# require_admin -> require_role -> require_non_temporary_password -> require_active_user -> require_auth_token
def require_admin(
    user: Annotated[User, Depends(require_role(Role.ADMIN))],
) -> User:
    return user    


UserDep = Annotated[User, Depends(require_non_temporary_password)]
AdminUserDep = Annotated[User, Depends(require_admin)]
PasswordChangeRequiredUserDep = Annotated[User, Depends(require_active_user)]
