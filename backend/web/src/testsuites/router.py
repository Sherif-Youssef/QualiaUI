from typing import Annotated
from pydantic import AfterValidator
from fastapi import APIRouter, Depends, Path, Body, Query, status
from src.database import SessionDep
from src.projects.dependencies import AccessableProjectDep, EditableProjectDep
from .models import TestSuite
from .schemas import TestSuiteCreate, TestSuiteRead, TestSuiteUpdate
from .dependencies import AccessableTestSuiteDep, EditableTestSuiteDep, TestSuiteRepositoryDep


router = APIRouter(
    prefix="/projects/{project_id}/testsuites",
    tags=["testsuites"]
)


@router.get("", response_model=list[TestSuiteRead])
def list_testsuites(project: AccessableProjectDep) -> list[TestSuite]:
    return project.testsuites


@router.get("/{testsuite_id}", response_model=TestSuiteRead)
def get_testsuite(testsuite: AccessableTestSuiteDep) -> TestSuite:
    return testsuite


@router.post("", response_model=TestSuiteRead)
def create_testsuite(testsuite_info: Annotated[TestSuiteCreate, Body()], project: EditableProjectDep, repo: TestSuiteRepositoryDep) -> TestSuite:
    testsuite = TestSuite(name=testsuite_info.name, project=project)
    return repo.save(testsuite)


@router.put("/{testsuite_id}", response_model=TestSuiteRead)
def update_testsuite(testsuite: EditableTestSuiteDep, testsuite_info: Annotated[TestSuiteUpdate, Body()], repo: TestSuiteRepositoryDep) -> TestSuite:
    testsuite.sqlmodel_update(testsuite_info)
    return repo.save(testsuite)


@router.delete("/{testsuite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testsuite(testsuite: EditableTestSuiteDep, repo: TestSuiteRepositoryDep) -> None:
    repo.delete(testsuite)
