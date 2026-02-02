from typing import Annotated
from sqlmodel import select
from fastapi import Depends, Path, HTTPException, Body
from src.auth.models import User
from src.database import SessionDep
from src.testsuites.dependencies import AccessableTestSuiteDep, EditableTestSuiteDep
from .models import TestCase, TestCaseStep
from .repository import TestCaseRepository


TestCaseRepositoryDep = Annotated[TestCaseRepository, Depends()]

def get_accessable_testcase(testcase_id: int, testsuite: AccessableTestSuiteDep, repo: TestCaseRepository) -> TestCase:
    testcase = repo.get(testsuite.id, testcase_id)
    if testcase is None:
        raise HTTPException(status_code=404, detail="Testcase not found")
    
    return testcase


AccessableTestCaseDep = Annotated[TestCase, Depends(get_accessable_testcase)]


def get_editable_testcase(testcase: AccessableTestCaseDep, testsuite: EditableTestSuiteDep):
    return testcase


EditableTestCaseDep = Annotated[TestCase, Depends(get_editable_testcase)]
