import pytest
from fastapi import HTTPException

from src.auth.models import Role as UserRole
from src.projects.models import Role as ProjectRole
from src.runs.models import TestRunMode, TestStatus
from src.runs.history.service import (
    get_testrun,
    list_testruns,
    remove_testrun,
    get_testcaserun,
    list_testcaseruns,
    get_teststeprun,
    list_teststepruns,
)
from src.base.schemas import PaginationParams


# ── TestRun: get ─────────────────────────────────────────────────────


def test_get_testrun_requires_project_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    member = user_factory("member_tr_get", "member_tr_get@example.com")
    outsider = user_factory("outsider_tr_get", "outsider_tr_get@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-get-001", name="Run 1")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_testrun(session, outsider, project.id, testrun.run_uid)  # type: ignore[arg-type]
    assert exc.value.status_code == 403

    result = get_testrun(session, member, project.id, testrun.run_uid)  # type: ignore[arg-type]
    assert result.id == testrun.run_uid


def test_get_testrun_not_found(
    session,
    user_factory,
    project_factory,
    project_link_factory,
):
    viewer = user_factory("viewer_tr_nf", "viewer_tr_nf@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

    with pytest.raises(HTTPException) as exc:
        get_testrun(session, viewer, project.id, "nonexistent-uid")  # type: ignore[arg-type]
    assert exc.value.status_code == 404


# ── TestRun: list ────────────────────────────────────────────────────


def test_list_testruns_requires_project_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    member = user_factory("member_tr_list", "member_tr_list@example.com")
    outsider = user_factory("outsider_tr_list", "outsider_tr_list@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testrun_factory(project.id, "run-list-001", name="Run 1")  # type: ignore[arg-type]
    testrun_factory(project.id, "run-list-002", name="Run 2")  # type: ignore[arg-type]

    pagination = PaginationParams(offset=0, limit=10)

    with pytest.raises(HTTPException) as exc:
        list_testruns(session, outsider, project.id, pagination)  # type: ignore[arg-type]
    assert exc.value.status_code == 403

    page = list_testruns(session, member, project.id, pagination)  # type: ignore[arg-type]
    assert page.total_items == 2
    assert len(page.items) == 2


def test_list_testruns_pagination(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    viewer = user_factory("viewer_tr_page", "viewer_tr_page@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

    for i in range(5):
        testrun_factory(project.id, f"run-page-{i:03d}", name=f"Run {i}")  # type: ignore[arg-type]

    page = list_testruns(session, viewer, project.id, PaginationParams(offset=0, limit=2))  # type: ignore[arg-type]
    assert len(page.items) == 2
    assert page.total_items == 5

    page2 = list_testruns(session, viewer, project.id, PaginationParams(offset=2, limit=2))  # type: ignore[arg-type]
    assert len(page2.items) == 2


# ── TestRun: delete ──────────────────────────────────────────────────


def test_remove_testrun_requires_admin(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    editor = user_factory("editor_tr_del", "editor_tr_del@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
    testrun = testrun_factory(project.id, "run-del-001", name="Run 1")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        remove_testrun(session, editor, project.id, testrun.run_uid)  # type: ignore[arg-type]
    assert exc.value.status_code == 403


def test_remove_testrun_as_admin(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    admin = user_factory("admin_tr_del", "admin_tr_del@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(admin.id, project.id, ProjectRole.ADMIN)
    testrun = testrun_factory(project.id, "run-del-002", name="Run 1")  # type: ignore[arg-type]

    remove_testrun(session, admin, project.id, testrun.run_uid)  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_testrun(session, admin, project.id, testrun.run_uid)  # type: ignore[arg-type]
    assert exc.value.status_code == 404


def test_remove_testrun_cascades_children(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
    teststeprun_factory,
):
    admin = user_factory("admin_tr_cascade", "admin_tr_cascade@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(admin.id, project.id, ProjectRole.ADMIN)
    testrun = testrun_factory(project.id, "run-cascade-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "click"})  # type: ignore[arg-type]

    remove_testrun(session, admin, project.id, testrun.run_uid)  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_testrun(session, admin, project.id, testrun.run_uid)  # type: ignore[arg-type]
    assert exc.value.status_code == 404


# ── TestCaseRun: get ─────────────────────────────────────────────────


def test_get_testcaserun_requires_project_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
):
    member = user_factory("member_tcr_get", "member_tcr_get@example.com")
    outsider = user_factory("outsider_tcr_get", "outsider_tcr_get@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tcr-get-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_testcaserun(
            session, outsider, project.id, testrun.run_uid, testcaserun.id,  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 403

    result = get_testcaserun(
        session, member, project.id, testrun.run_uid, testcaserun.id,  # type: ignore[arg-type]
    )
    assert result.id == testcaserun.id
    assert result.testrun_id == testrun.id


def test_get_testcaserun_not_found(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    viewer = user_factory("viewer_tcr_nf", "viewer_tcr_nf@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tcr-nf-001", name="Run 1")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_testcaserun(session, viewer, project.id, testrun.run_uid, 99999)  # type: ignore[arg-type]
    assert exc.value.status_code == 404


# ── TestCaseRun: list ────────────────────────────────────────────────


def test_list_testcaseruns_requires_project_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
):
    member = user_factory("member_tcr_list", "member_tcr_list@example.com")
    outsider = user_factory("outsider_tcr_list", "outsider_tcr_list@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tcr-list-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    testcaserun_factory(testrun.id, name="Case 2")  # type: ignore[arg-type]

    pagination = PaginationParams(offset=0, limit=10)

    with pytest.raises(HTTPException) as exc:
        list_testcaseruns(session, outsider, project.id, testrun.run_uid, pagination)  # type: ignore[arg-type]
    assert exc.value.status_code == 403

    page = list_testcaseruns(session, member, project.id, testrun.run_uid, pagination)  # type: ignore[arg-type]
    assert page.total_items == 2
    assert len(page.items) == 2


def test_list_testcaseruns_pagination(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
):
    viewer = user_factory("viewer_tcr_page", "viewer_tcr_page@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tcr-page-001", name="Run 1")  # type: ignore[arg-type]

    for i in range(5):
        testcaserun_factory(testrun.id, name=f"Case {i}")  # type: ignore[arg-type]

    page = list_testcaseruns(
        session, viewer, project.id, testrun.run_uid, PaginationParams(offset=0, limit=2),  # type: ignore[arg-type]
    )
    assert len(page.items) == 2
    assert page.total_items == 5


# ── TestStepRun: get ─────────────────────────────────────────────────


def test_get_teststeprun_requires_project_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
    teststeprun_factory,
):
    member = user_factory("member_tsr_get", "member_tsr_get@example.com")
    outsider = user_factory("outsider_tsr_get", "outsider_tsr_get@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tsr-get-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun = teststeprun_factory(testcaserun.id, executable={"action": "click"})  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_teststeprun(
            session, outsider, project.id,  # type: ignore[arg-type]
            testrun.run_uid, testcaserun.id, teststeprun.id,  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 403

    result = get_teststeprun(
        session, member, project.id,  # type: ignore[arg-type]
        testrun.run_uid, testcaserun.id, teststeprun.id,  # type: ignore[arg-type]
    )
    assert result.id == teststeprun.id
    assert result.testcaserun_id == testcaserun.id


def test_get_teststeprun_not_found(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
):
    viewer = user_factory("viewer_tsr_nf", "viewer_tsr_nf@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tsr-nf-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        get_teststeprun(
            session, viewer, project.id,  # type: ignore[arg-type]
            testrun.run_uid, testcaserun.id, 99999,  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 404


# ── TestStepRun: list ────────────────────────────────────────────────


def test_list_teststepruns_requires_project_access(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
    teststeprun_factory,
):
    member = user_factory("member_tsr_list", "member_tsr_list@example.com")
    outsider = user_factory("outsider_tsr_list", "outsider_tsr_list@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(member.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tsr-list-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "click"})  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "type"})  # type: ignore[arg-type]

    pagination = PaginationParams(offset=0, limit=10)

    with pytest.raises(HTTPException) as exc:
        list_teststepruns(
            session, outsider, project.id,  # type: ignore[arg-type]
            testrun.run_uid, testcaserun.id, pagination,  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 403

    page = list_teststepruns(
        session, member, project.id,  # type: ignore[arg-type]
        testrun.run_uid, testcaserun.id, pagination,  # type: ignore[arg-type]
    )
    assert page.total_items == 2
    assert len(page.items) == 2


def test_list_teststepruns_pagination(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
    testcaserun_factory,
    teststeprun_factory,
):
    viewer = user_factory("viewer_tsr_page", "viewer_tsr_page@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tsr-page-001", name="Run 1")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    for i in range(5):
        teststeprun_factory(testcaserun.id, executable={"step": i})  # type: ignore[arg-type]

    page = list_teststepruns(
        session, viewer, project.id,  # type: ignore[arg-type]
        testrun.run_uid, testcaserun.id, PaginationParams(offset=0, limit=2),  # type: ignore[arg-type]
    )
    assert len(page.items) == 2
    assert page.total_items == 5


def test_list_teststepruns_nonexistent_testcaserun(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    viewer = user_factory("viewer_tsr_bad_tcr", "viewer_tsr_bad_tcr@example.com")
    project = project_factory("Project", "Test project")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-tsr-bad-tcr-001", name="Run 1")  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        list_teststepruns(
            session, viewer, project.id,  # type: ignore[arg-type]
            testrun.run_uid, 99999, PaginationParams(offset=0, limit=10),  # type: ignore[arg-type]
        )
    assert exc.value.status_code == 404


# ── Cross-project isolation ──────────────────────────────────────────


def test_cannot_access_testrun_from_other_project(
    session,
    user_factory,
    project_factory,
    project_link_factory,
    testrun_factory,
):
    user = user_factory("user_isolation", "user_isolation@example.com")
    project_a = project_factory("Project A", "Project A")
    project_b = project_factory("Project B", "Project B")
    project_link_factory(user.id, project_a.id, ProjectRole.VIEWER)
    project_link_factory(user.id, project_b.id, ProjectRole.VIEWER)

    testrun_a = testrun_factory(project_a.id, "run-isolation-a", name="Run A")  # type: ignore[arg-type]

    # Access via correct project works
    result = get_testrun(session, user, project_a.id, testrun_a.run_uid)  # type: ignore[arg-type]
    assert result.id == testrun_a.run_uid

    # Access via wrong project fails — run doesn't exist in project_b
    with pytest.raises(HTTPException) as exc:
        get_testrun(session, user, project_b.id, testrun_a.run_uid)  # type: ignore[arg-type]
    assert exc.value.status_code == 404