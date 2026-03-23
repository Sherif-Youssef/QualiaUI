from sqlmodel import Session, select, col
from sqlalchemy import func

from .models import User


def get_by_username_or_email(session: Session, username_or_email: str) -> User | None:
    """Get a user by username or email.

    Values containing ``@`` are treated as email addresses; otherwise the
    lookup uses username.
    """

    statement = select(User).where(
        User.email == username_or_email if '@' in username_or_email else User.username == username_or_email
    )
    return session.exec(statement).first()

def get_by_id(session: Session, id: int) -> User | None:
    statement = select(User).where(
        User.id == id
    )
    return session.exec(statement).first()

def get_by_ids(session: Session, ids: list[int]) -> list[User]:
    statement = select(User).where(
        col(User.id).in_(ids)
    )
    return list(session.exec(statement).all())

def count_by_ids(session: Session, ids: list[int]) -> int:
    statement = select(func.count()).where(col(User.id).in_(ids))
    return session.exec(statement).one()

def exists_by_username(session: Session, username: str) -> bool:
    """Return ``True`` if a username already exists."""

    statement = select(User).where(
        User.username == username
    )
    return session.exec(statement).first() is not None

def exists_by_email(session: Session, email: str) -> bool:
    """Return ``True`` if an email address already exists."""

    statement = select(User).where(
        User.email == email
    )
    return session.exec(statement).first() is not None
