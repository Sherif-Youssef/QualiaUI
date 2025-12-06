from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from fastapi import Depends, HTTPException
from src.database import SessionDep
from sqlmodel import select
from .service import JWTService
from .models import User
from .schemas import TokenType


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/tokens", refreshUrl="/tokens/refresh") 

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep
) -> User:
    payload = JWTService.decode_token(token, expected_type=TokenType.ACCESS)
    user = session.exec(
        select(User).where(User.id == payload.user_id)
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return user


UserDep = Annotated[User, Depends(get_current_user)]