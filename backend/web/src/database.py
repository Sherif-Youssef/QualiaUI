from typing import Annotated

from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine

from .config import settings

from src.auth.models import User
from src.projects.models import Project, UserProjectLink
from src.testsuites.models import TestSuite
from src.testcases.models import TestCase
from src.runs.models import ProjectRun, TestSuiteRun, TestCaseRun, TestStepRun
from src.llms.models import Provider, LLMModel

engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

