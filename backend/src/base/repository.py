from typing import Any, TypeVar
from sqlmodel import select, SQLModel, col
from src.database import SessionDep

ModelObj = TypeVar("ModelObj", bound="SQLModel")

class BaseRepository:
    def __init__(self, session: SessionDep):
        self.session = session
    
    def commit(self):
        self.session.commit()

    def save(self, obj: ModelObj, commit: bool = True) -> ModelObj:
        self.session.add(obj)
        if commit:
            self.commit()
            self.session.refresh(obj)
        return obj

    def delete(self, obj: ModelObj, commit: bool = True) -> None:
        self.session.delete(obj)
        if commit:
            self.commit()
        return obj