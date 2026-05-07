from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from .config import settings
from .models import *

engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

