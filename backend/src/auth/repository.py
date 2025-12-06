from sqlmodel import Session, select, col
from src.database import SessionDep
from .models import User

class UserRepository:
    def __init__(self, session: SessionDep):
        self.session = session

    def get_by_username_or_email(self, username_or_email: str) -> User | None:
        statement = select(User).where(
            User.email == username_or_email if '@' in username_or_email else User.username == username_or_email
        )
        return self.session.exec(statement).first()
    
    def get_by_id(self, id: int) -> User | None:
        statement = select(User).where(
            User.id == id
        )
        return self.session.exec(statement).first()
    
    def get_by_ids(self, ids: list[int]) -> list[User]:
        return self.session.exec(
            select(User).where(col(User.id).in_(ids))
        ).all()

    def exists_by_username(self, username: str) -> bool:
        statement = select(User).where(
            User.username == username
        )
        return self.session.exec(statement).first() is not None
    
    def exists_by_email(self, email: str) -> bool:
        statement = select(User).where(
            User.email == email
        )
        return self.session.exec(statement).first() is not None
    
    def save(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user