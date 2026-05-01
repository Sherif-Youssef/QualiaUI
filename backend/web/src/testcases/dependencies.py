# src/testcases/dependencies.py

from typing import Annotated

from fastapi import Depends, HTTPException, Path

from src.auth.dependencies import UserDep
from src.database import SessionDep
from src.projects.queries import get_with_link
from src.projects.dependencies import check_project_role
from src.projects.models import Role as ProjectRole

from .models import TestCase
from .queries import get_by_id_with_user_link


def _testcase_dep_factory(minimum_role: ProjectRole):
    """Validates project access, then resolves and returns the test case."""

    def dependency(
        session: SessionDep,
        user: UserDep,
        testcase_id: int = Path(...),
    ) -> TestCase:
        testcase_with_link = get_by_id_with_user_link(session, testcase_id, user.id) # type: ignore[arg-type]
        
        if not testcase_with_link:
            raise HTTPException(status_code=404, detail="Test case not found")

        testcase, link = testcase_with_link

        check_project_role(user, link, minimum_role)

        return testcase

    return dependency

get_viewer_testcase = _testcase_dep_factory(ProjectRole.VIEWER)
get_editor_testcase = _testcase_dep_factory(ProjectRole.EDITOR)
get_admin_testcase = _testcase_dep_factory(ProjectRole.ADMIN)

ViewerTestCaseDep = Annotated[TestCase, Depends(get_viewer_testcase)]
EditorTestCaseDep = Annotated[TestCase, Depends(get_editor_testcase)]
AdminTestCaseDep  = Annotated[TestCase, Depends(get_admin_testcase)]
