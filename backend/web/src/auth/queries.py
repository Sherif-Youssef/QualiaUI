from sqlmodel import Session, select, col
from sqlalchemy import func

from .models import Role, User


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


def list_users(
    session: Session,
    email: str | None = None,
    username: str | None = None,
    role: Role | None = None,
    is_active: bool | None = None,
    is_temp_pass: bool | None = None,
    offset: int = 0,
    limit: int = 25,
) -> tuple[list[User], int]:
    statement = select(User)

    if email:
        term = f"%{email.strip().lower()}%"
        statement = statement.where(func.lower(User.email).like(term))

    if username:
        term = f"%{username.strip().lower()}%"
        statement = statement.where(func.lower(User.username).like(term))

    if role is not None:
        statement = statement.where(User.role == role)
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
    if is_temp_pass is not None:
        statement = statement.where(User.is_temp_pass == is_temp_pass)

    count_statement = select(func.count()).select_from(statement.subquery())
    total_items = session.exec(count_statement).one()

    statement = statement.order_by(col(User.id)).offset(offset).limit(limit)
    return list(session.exec(statement).all()), total_items
