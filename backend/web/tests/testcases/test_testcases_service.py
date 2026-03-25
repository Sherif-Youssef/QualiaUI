import pytest
from fastapi import HTTPException

from src.auth.models import Role as UserRole
from src.projects.models import Role as ProjectRole
from src.testcases.schemas import TestCaseCreate as TCCreate, TestCaseUpdate as TCUpdate
from src.testcases.service import (
	create_testcase,
	delete_testcase,
	get_testcase,
	update_testcase,
)


def test_create_testcase_requires_project_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
):
	viewer = user_factory("viewer_testcase", "viewer_testcase@example.com", role=UserRole.VIEWER)
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]

	with pytest.raises(HTTPException) as exc:
		create_testcase(
			session,
			viewer,
			project.id,  # type: ignore[arg-type]
			testsuite.id,  # type: ignore[arg-type]
			TCCreate(
				name="Login",
				description="Login test",
				base_url="https://example.com",
				instruction="Click login",
			),
		)

	assert exc.value.status_code == 403


def test_create_testcase_as_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
):
	editor = user_factory("editor_testcase", "editor_testcase@example.com", role=UserRole.VIEWER)
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]

	created = create_testcase(
		session,
		editor,
		project.id,  # type: ignore[arg-type]
		testsuite.id,  # type: ignore[arg-type]
		TCCreate(
			name="Login Test",
			description="Test login flow",
			base_url="https://example.com",
			instruction="Click login button",
		),
	)

	assert created.id is not None
	assert created.testsuite_id == testsuite.id
	assert created.name == "Login Test"
	assert created.base_url == "https://example.com"


def test_get_testcase_requires_project_view_access(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	member = user_factory("member_testcase", "member_testcase@example.com")
	outsider = user_factory("outsider_testcase", "outsider_testcase@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(member.id, project.id, ProjectRole.VIEWER)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]
	testcase = testcase_factory(testsuite.id, "Login", "Test login")  # type: ignore[arg-type]

	with pytest.raises(HTTPException) as exc:
		get_testcase(
			session,
			outsider,
			project.id,  # type: ignore[arg-type]
			testsuite.id,  # type: ignore[arg-type]
			testcase.id,  # type: ignore[arg-type]
		)

	assert exc.value.status_code == 403

	fetched = get_testcase(
		session,
		member,
		project.id,  # type: ignore[arg-type]
		testsuite.id,  # type: ignore[arg-type]
		testcase.id,  # type: ignore[arg-type]
	)
	assert fetched.id == testcase.id
	assert fetched.name == "Login"


def test_update_testcase_requires_project_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	viewer = user_factory("viewer_upd_testcase", "viewer_upd_testcase@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]
	testcase = testcase_factory(testsuite.id, "Login", "Old description")  # type: ignore[arg-type]

	with pytest.raises(HTTPException) as exc:
		update_testcase(
			session,
			viewer,
			project.id,  # type: ignore[arg-type]
			testsuite.id,  # type: ignore[arg-type]
			testcase.id,  # type: ignore[arg-type]
			TCUpdate(name="Updated"),
		)

	assert exc.value.status_code == 403


def test_update_testcase_as_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	editor = user_factory("editor_upd_testcase", "editor_upd_testcase@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]
	testcase = testcase_factory(testsuite.id, "Login", "Old description")  # type: ignore[arg-type]

	updated = update_testcase(
		session,
		editor,
		project.id,  # type: ignore[arg-type]
		testsuite.id,  # type: ignore[arg-type]
		testcase.id,  # type: ignore[arg-type]
		TCUpdate(
			name="Updated Test",
			description="New description",
			base_url="https://updated.com",
			instruction="New instruction",
		),
	)

	assert updated.name == "Updated Test"
	assert updated.description == "New description"
	assert updated.base_url == "https://updated.com"


def test_delete_testcase_requires_project_admin(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	editor = user_factory("editor_del_testcase", "editor_del_testcase@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]
	testcase = testcase_factory(testsuite.id, "Login", "Test")  # type: ignore[arg-type]

	with pytest.raises(HTTPException) as exc:
		delete_testcase(
			session,
			editor,
			project.id,  # type: ignore[arg-type]
			testsuite.id,  # type: ignore[arg-type]
			testcase.id,  # type: ignore[arg-type]
		)

	assert exc.value.status_code == 403


def test_delete_testcase_as_project_admin(
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	admin = user_factory("admin_del_testcase", "admin_del_testcase@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(admin.id, project.id, ProjectRole.ADMIN)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")  # type: ignore[arg-type]
	testcase = testcase_factory(testsuite.id, "Login", "Test")  # type: ignore[arg-type]

	delete_testcase(
		session,
		admin,
		project.id,  # type: ignore[arg-type]
		testsuite.id,  # type: ignore[arg-type]
		testcase.id,  # type: ignore[arg-type]
	)

	with pytest.raises(HTTPException) as exc:
		get_testcase(
			session,
			admin,
			project.id,  # type: ignore[arg-type]
			testsuite.id,  # type: ignore[arg-type]
			testcase.id,  # type: ignore[arg-type]
		)

	assert exc.value.status_code == 404
