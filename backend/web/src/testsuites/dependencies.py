# src/testsuites/dependencies.py

from typing import Annotated

from fastapi import Depends, HTTPException, Path

from src.auth.dependencies import UserDep
from src.database import SessionDep
from src.projects.dependencies import check_project_role
from src.projects.models import Role as ProjectRole

from .models import TestSuite
from .queries import get_by_id_with_user_link


def _testsuite_dep_factory(minimum_role: ProjectRole):
    """Validates project access, then resolves and returns the test suite."""

    def dependency(
        session: SessionDep,
        user: UserDep,
        testsuite_id: int = Path(...),
    ) -> TestSuite:
        testsuite_with_link = get_by_id_with_user_link(session, testsuite_id, user.id) # type: ignore[arg-type]
        
        if not testsuite_with_link:
            raise HTTPException(status_code=404, detail="Test suite not found")
        
        testsuite, user_link = testsuite_with_link

        check_project_role(user, user_link, minimum_role)

        return testsuite

    return dependency

get_viewer_testsuite = _testsuite_dep_factory(ProjectRole.VIEWER)
get_editor_testsuite = _testsuite_dep_factory(ProjectRole.EDITOR)
get_admin_testsuite = _testsuite_dep_factory(ProjectRole.ADMIN)

ViewerTestSuiteDep = Annotated[TestSuite, Depends(get_viewer_testsuite)]
EditorTestSuiteDep = Annotated[TestSuite, Depends(get_editor_testsuite)]
AdminTestSuiteDep  = Annotated[TestSuite, Depends(get_admin_testsuite)]
