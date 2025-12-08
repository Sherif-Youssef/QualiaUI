from typing import Annotated
from pydantic import AfterValidator
from fastapi import APIRouter, Depends, Path, Body, Query, status
from src.database import SessionDep
from src.projects.dependencies import AccessableProjectDep, EditableProjectDep
from .models import TestCase, TestCaseStep, TestCaseStepType
from .dependencies import AccessableTestCaseDep, EditableTestCaseDep, TestCaseRepositoryDep


router = APIRouter(
    prefix="/projects/{project_id}/testsuites/{testsuite_id}/testcases",
    tags=["testcases"]
)

