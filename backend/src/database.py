from typing import Annotated
from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine
from pathlib import Path
from .config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

def create_all():
    SQLModel.metadata.create_all(engine)
