import pytest
from fastapi import HTTPException

from src.auth.models import Role as UserRole
from src.projects.models import Role as ProjectRole
from src.testsuites.schemas import TestSuiteCreate as TSCreate, TestSuiteUpdate as TSUpdate
from src.testsuites.service import (
    create_testsuite,
    delete_testsuite,
    get_testsuite,
    update_testsuite,
)


def test_create_testsuite_requires_project_editor(
    session,
    user_factory,
    project_factory,
    project_link_factory,
):
    viewer = user_factory("viewer_suite", "viewer_suite@example.com", role=UserRole.VIEWER)
    project = project_factory("Suites", "Only editor can create")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

    with pytest.raises(HTTPException) as exc:
        create_testsuite(
            session,
            viewer,
            project.id,  # type: ignore[arg-type]
            TSCreate(name="Smoke", description=""),
        )

    assert exc.value.status_code == 403


def test_create_testsuite_as_editor(
    session,
    user_factory,
    project_factory,
    project_link_factory,
):
    editor = user_factory("editor_suite", "editor_suite@example.com", role=UserRole.VIEWER)
    project = project_factory("Suites", "Create allowed")
    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

    created = create_testsuite(
        session,
        editor,
        project.id,  # type: ignore[arg-type]
        TSCreate(name="Smoke", description="Core checks"),
    )

    assert created.id is not None
    assert created.project_id == project.id
    assert created.name == "Smoke"


def test_get_testsuite_requires_project_view_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testsuite_factory,
):
    member = user_factory("member_suite", "member_suite@example.com")
    outsider = user_factory("outsider_suite", "outsider_suite@example.com")
    project = project_factory("Suites", "Access")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testsuite = testsuite_factory(project.id, "Regression", "Checks")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_testsuite(
            session,
            outsider,
            project.id,  # type: ignore[arg-type]
            testsuite.id,  # type: ignore[arg-type]
        )

    assert exc.value.status_code == 403

    fetched = get_testsuite(
        session,
        member,
        project.id,  # type: ignore[arg-type]
        testsuite.id,  # type: ignore[arg-type]
    )
    assert fetched.id == testsuite.id


def test_update_testsuite_requires_project_editor(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testsuite_factory,
):
    viewer = user_factory("viewer_upd_suite", "viewer_upd_suite@example.com")
    project = project_factory("Suites", "Update")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testsuite = testsuite_factory(project.id, "Regression", "Old")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        update_testsuite(
            session,
            viewer,
            project.id,  # type: ignore[arg-type]
            testsuite.id,  # type: ignore[arg-type]
            TSUpdate(name="Updated"),
        )

    assert exc.value.status_code == 403


def test_update_testsuite_as_editor(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testsuite_factory,
):
    editor = user_factory("editor_upd_suite", "editor_upd_suite@example.com")
    project = project_factory("Suites", "Update")
    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
    testsuite = testsuite_factory(project.id, "Regression", "Old")  # type: ignore[arg-type]

    updated = update_testsuite(
        session,
        editor,
        project.id,  # type: ignore[arg-type]
        testsuite.id,  # type: ignore[arg-type]
        TSUpdate(name="Updated", description="New"),
    )

    assert updated.name == "Updated"
    assert updated.description == "New"


def test_delete_testsuite_requires_project_admin(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testsuite_factory,
):
    editor = user_factory("editor_del_suite", "editor_del_suite@example.com")
    project = project_factory("Suites", "Delete")
    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
    testsuite = testsuite_factory(project.id, "Regression", "Delete me")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        delete_testsuite(
            session,
            editor,
            project.id,  # type: ignore[arg-type]
            testsuite.id,  # type: ignore[arg-type]
        )

    assert exc.value.status_code == 403


def test_delete_testsuite_as_project_admin(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testsuite_factory,
):
    admin = user_factory("admin_del_suite", "admin_del_suite@example.com")
    project = project_factory("Suites", "Delete")
    project_link_factory(admin.id, project.id, ProjectRole.ADMIN)
    testsuite = testsuite_factory(project.id, "Regression", "Delete me")  # type: ignore[arg-type]

    delete_testsuite(
        session,
        admin,
        project.id,  # type: ignore[arg-type]
        testsuite.id,  # type: ignore[arg-type]
    )

    with pytest.raises(HTTPException) as exc:
        get_testsuite(
            session,
            admin,
            project.id,  # type: ignore[arg-type]
            testsuite.id,  # type: ignore[arg-type]
        )

    assert exc.value.status_code == 404
