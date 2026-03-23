from typing import Annotated

from fastapi import Depends, HTTPException, Header, status

from src.database import SessionDep
from .service import decode_token
from .models import User
from .schemas import TokenType
from .queries import get_by_id
from .exceptions import TokenError


async def get_auth_token(
    authorization: Annotated[str | None, Header()] = None,
) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header.")

    try:
        scheme, header_token = authorization.split(maxsplit=1)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format.")

    token = header_token.strip()

    if not token or scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format.")

    return token

async def get_current_user(
    session: SessionDep,
    token: Annotated[str, Depends(get_auth_token)],
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


UserDep = Annotated[User, Depends(get_current_user)]