from typing import Annotated

from fastapi import Depends, HTTPException, Path
from sqlalchemy import and_
from sqlmodel import select

from src.auth.dependencies import UserDep
from src.database import SessionDep
from src.projects.dependencies import check_project_role
from src.projects.models import Role as ProjectRole, UserProjectLink
from src.testcases.models import TestCase
from src.testsuites.models import TestSuite
from src.runs.models import TestCaseRun, TestSuiteRun
from src.projects.models import Project

from .queries import get_testcase_run_by_id_with_user_link, get_testsuite_run_by_id_with_user_link

def _testcase_run_dep_factory(minimum_role: ProjectRole):
    def dependency(
        session: SessionDep,
        user: UserDep,
        testcase_run_id: int = Path(...),
    ) -> TestCaseRun:
        testcase_run_with_link = get_testcase_run_by_id_with_user_link(session, testcase_run_id, user_id=user.id) # type: ignore[arg-type]
        
        if testcase_run_with_link is None: 
            raise HTTPException(status_code=404, detail="Testcase run not found")
        
        testcase_run, user_link = testcase_run_with_link

        check_project_role(user, user_link, minimum_role)

        return testcase_run

    return dependency



def _testsuite_run_dep_factory(minimum_role: ProjectRole):
    def dependency(
        session: SessionDep,
        user: UserDep,
        testsuite_run_id: int = Path(...),
    ) -> TestSuiteRun:
        testsuite_run_with_link = get_testsuite_run_by_id_with_user_link(session, testsuite_run_id, user_id=user.id) # type: ignore[arg-type]
        
        if testsuite_run_with_link is None: 
            raise HTTPException(status_code=404, detail="Testsuite run not found")
        
        testsuite_run, user_link = testsuite_run_with_link

        check_project_role(user, user_link, minimum_role)

        return testsuite_run

    return dependency


# test case run

ViewerTestCaseRunDep = Annotated[
    TestCaseRun,
    Depends(_testcase_run_dep_factory(ProjectRole.VIEWER)),
]

EditorTestCaseRunDep = Annotated[
    TestCaseRun,
    Depends(_testcase_run_dep_factory(ProjectRole.EDITOR)),
]

AdminTestCaseRunDep = Annotated[
    TestCaseRun,
    Depends(_testcase_run_dep_factory(ProjectRole.ADMIN)),
]

# test suite run

ViewerTestSuiteRunDep = Annotated[
    TestSuiteRun,
    Depends(_testsuite_run_dep_factory(ProjectRole.VIEWER)),
]

EditorTestSuiteRunDep = Annotated[
    TestSuiteRun,
    Depends(_testsuite_run_dep_factory(ProjectRole.EDITOR)),
]

AdminTestSuiteRunDep = Annotated[
    TestSuiteRun,
    Depends(_testsuite_run_dep_factory(ProjectRole.ADMIN)),
]


