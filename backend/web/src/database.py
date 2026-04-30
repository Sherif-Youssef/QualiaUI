from typing import Annotated

from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine

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
    from src.testcases.models import TestCase
    from src.runs.models import ProjectRun, TestSuiteRun, TestCaseRun, TestStepRun
    ns = {
        "Project": Project,
        "TestSuite": TestSuite,
        "TestCase": TestCase,
        "ProjectRun": ProjectRun,
        "TestSuiteRun": TestSuiteRun,
        "TestCaseRun": TestCaseRun,
        "TestStepRun": TestStepRun,
    }

    User.model_rebuild(_types_namespace=ns)
    Project.model_rebuild(_types_namespace=ns)
    UserProjectLink.model_rebuild(_types_namespace=ns)
    TestSuite.model_rebuild(_types_namespace=ns)
    TestCase.model_rebuild(_types_namespace=ns)
    ProjectRun.model_rebuild(_types_namespace=ns)
    TestSuiteRun.model_rebuild(_types_namespace=ns)
    TestCaseRun.model_rebuild(_types_namespace=ns)
    TestStepRun.model_rebuild(_types_namespace=ns)

    SQLModel.metadata.create_all(engine)

