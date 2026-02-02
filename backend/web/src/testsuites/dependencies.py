from typing import Annotated
from sqlmodel import select
from fastapi import Depends, Path, HTTPException, Body
from src.auth.models import User
from src.database import SessionDep
from src.projects.dependencies import AccessableProjectDep, EditableProjectDep
from .models import TestSuite
from .repository import TestSuiteRepository


TestSuiteRepositoryDep = Annotated[TestSuiteRepository, Depends()]


def get_accessable_testsuite(testsuite_id: int, project: AccessableProjectDep, repo: TestSuiteRepositoryDep) -> TestSuite:
    testsuite = repo.get(project.id, testsuite_id)
    if testsuite is None:
        raise HTTPException(status_code=404, detail="Testsuite not found")

    return testsuite


AccessableTestSuiteDep = Annotated[TestSuite, Depends(get_accessable_testsuite)]


def get_editable_testsuite(testsuite: AccessableTestSuiteDep, project: EditableProjectDep):
    return testsuite


EditableTestSuiteDep = Annotated[TestSuite, Depends(get_editable_testsuite)]
