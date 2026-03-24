# src/testsuites/dependencies.py

from typing import Annotated

from fastapi import Depends, HTTPException, Path

from src.auth.dependencies import UserDep
from src.database import SessionDep
from src.projects.dependencies import _get_project_with_link, _check_role
from src.projects.models import Role as ProjectRole

from .models import TestSuite
from .queries import get_by_id


def _testsuite_dep_factory(minimum_role: ProjectRole):
    """Validates project access, then resolves and returns the test suite."""

    def dependency(
        session: SessionDep,
        user: UserDep,
        project_id: int = Path(...),
        testsuite_id: int = Path(...),
    ) -> TestSuite:
        project, link = _get_project_with_link(session, project_id, user.id)
        _check_role(user, link, minimum_role)

        testsuite = get_by_id(session, project_id, testsuite_id)
        if not testsuite:
            raise HTTPException(status_code=404, detail="Test suite not found")
        return testsuite

    return dependency


ViewerTestSuiteDep = Annotated[TestSuite, Depends(_testsuite_dep_factory(ProjectRole.VIEWER))]
EditorTestSuiteDep = Annotated[TestSuite, Depends(_testsuite_dep_factory(ProjectRole.EDITOR))]
AdminTestSuiteDep  = Annotated[TestSuite, Depends(_testsuite_dep_factory(ProjectRole.ADMIN))]
