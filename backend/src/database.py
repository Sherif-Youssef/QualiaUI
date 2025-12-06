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
    from src.auth.models import User
    from src.projects.models import Project, UserProjectLink
    from src.testsuites.models import TestSuite
    User.model_rebuild()
    Project.model_rebuild()
    UserProjectLink.model_rebuild()
    TestSuite.model_rebuild()
    
    SQLModel.metadata.create_all(engine)
