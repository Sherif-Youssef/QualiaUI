import pytest

from src.projects.models import Role as ProjectRole
from src.runs.models import TestStatus


BASE = "/api/v1/projects"


def _history_url(project_id: int) -> str:
    return f"{BASE}/{project_id}/runs/history"


def _run_url(project_id: int, run_uid: str) -> str:
    return f"{BASE}/{project_id}/runs/history/{run_uid}"


def _caseruns_url(project_id: int, run_uid: str) -> str:
    return f"{_run_url(project_id, run_uid)}/testcaseruns"


def _caserun_url(project_id: int, run_uid: str, testcaserun_id: int) -> str:
    return f"{_caseruns_url(project_id, run_uid)}/{testcaserun_id}"


def _stepruns_url(project_id: int, run_uid: str, testcaserun_id: int) -> str:
    return f"{_caserun_url(project_id, run_uid, testcaserun_id)}/teststepruns"


def _steprun_url(
    project_id: int, run_uid: str, testcaserun_id: int, teststeprun_id: int,
) -> str:
    return f"{_stepruns_url(project_id, run_uid, testcaserun_id)}/{teststeprun_id}"


# ── TestRun: list ────────────────────────────────────────────────────


def test_list_testruns_unauthenticated(client, project_factory):
    project = project_factory("Project", "desc")
    resp = client.get(_history_url(project.id))
    assert resp.status_code == 401


def test_list_testruns_no_project_access(
    client, user_factory, project_factory, testrun_factory, override_current_user,
):
    outsider = user_factory("outsider_rt_list", "outsider_rt_list@example.com")
    project = project_factory("Project", "desc")
    testrun_factory(project.id, "run-rt-list-001")  # type: ignore[arg-type]

    override_current_user(outsider)
    resp = client.get(_history_url(project.id))
    assert resp.status_code == 403


def test_list_testruns_as_viewer(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_list", "viewer_rt_list@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun_factory(project.id, "run-rt-list-010", name="Run A")  # type: ignore[arg-type]
    testrun_factory(project.id, "run-rt-list-011", name="Run B")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(_history_url(project.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["total_items"] == 2
    assert len(body["items"]) == 2


def test_list_testruns_pagination(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_page", "viewer_rt_page@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

    for i in range(5):
        testrun_factory(project.id, f"run-rt-page-{i:03d}")  # type: ignore[arg-type]

    override_current_user(viewer)

    resp = client.get(_history_url(project.id), params={"limit": 2, "offset": 0})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["total_items"] == 5

    resp2 = client.get(_history_url(project.id), params={"limit": 2, "offset": 4})
    assert resp2.status_code == 200
    assert len(resp2.json()["items"]) == 1


# ── TestRun: get ─────────────────────────────────────────────────────


def test_get_testrun_unauthenticated(client, project_factory, testrun_factory):
    project = project_factory("Project", "desc")
    testrun = testrun_factory(project.id, "run-rt-get-unauth")  # type: ignore[arg-type]
    resp = client.get(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 401


def test_get_testrun_no_project_access(
    client, user_factory, project_factory, testrun_factory, override_current_user,
):
    outsider = user_factory("outsider_rt_get", "outsider_rt_get@example.com")
    project = project_factory("Project", "desc")
    testrun = testrun_factory(project.id, "run-rt-get-001")  # type: ignore[arg-type]

    override_current_user(outsider)
    resp = client.get(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 403


def test_get_testrun_as_viewer(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_get", "viewer_rt_get@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-get-010", name="My Run")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 200

    body = resp.json()
    assert body["id"] == testrun.run_uid
    assert body["name"] == "My Run"
    assert body["status"] == TestStatus.PASSED


def test_get_testrun_not_found(
    client, user_factory, project_factory, project_link_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_get_nf", "viewer_rt_get_nf@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

    override_current_user(viewer)
    resp = client.get(_run_url(project.id, "does-not-exist"))
    assert resp.status_code == 404


# ── TestRun: delete ──────────────────────────────────────────────────


def test_delete_testrun_as_viewer_forbidden(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_del", "viewer_rt_del@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-del-001")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.delete(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 403


def test_delete_testrun_as_editor_forbidden(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    editor = user_factory("editor_rt_del", "editor_rt_del@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
    testrun = testrun_factory(project.id, "run-rt-del-002")  # type: ignore[arg-type]

    override_current_user(editor)
    resp = client.delete(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 403


def test_delete_testrun_as_admin(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    admin = user_factory("admin_rt_del", "admin_rt_del@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(admin.id, project.id, ProjectRole.ADMIN)
    testrun = testrun_factory(project.id, "run-rt-del-003")  # type: ignore[arg-type]

    override_current_user(admin)

    resp = client.delete(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 204

    resp2 = client.get(_run_url(project.id, testrun.run_uid))
    assert resp2.status_code == 404


def test_delete_testrun_not_found(
    client, user_factory, project_factory, project_link_factory, override_current_user,
):
    admin = user_factory("admin_rt_del_nf", "admin_rt_del_nf@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(admin.id, project.id, ProjectRole.ADMIN)

    override_current_user(admin)
    resp = client.delete(_run_url(project.id, "does-not-exist"))
    assert resp.status_code == 404


# ── TestCaseRun: list ────────────────────────────────────────────────


def test_list_testcaseruns_no_project_access(
    client, user_factory, project_factory, testrun_factory,
    testcaserun_factory, override_current_user,
):
    outsider = user_factory("outsider_rt_tcr_list", "outsider_rt_tcr_list@example.com")
    project = project_factory("Project", "desc")
    testrun = testrun_factory(project.id, "run-rt-tcr-list-001")  # type: ignore[arg-type]
    testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    override_current_user(outsider)
    resp = client.get(_caseruns_url(project.id, testrun.run_uid))
    assert resp.status_code == 403


def test_list_testcaseruns_as_viewer(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_tcr_list", "viewer_rt_tcr_list@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tcr-list-010")  # type: ignore[arg-type]
    testcaserun_factory(testrun.id, name="Case A")  # type: ignore[arg-type]
    testcaserun_factory(testrun.id, name="Case B")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(_caseruns_url(project.id, testrun.run_uid))
    assert resp.status_code == 200

    body = resp.json()
    assert body["total_items"] == 2
    assert len(body["items"]) == 2


def test_list_testcaseruns_pagination(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_tcr_page", "viewer_rt_tcr_page@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tcr-page-001")  # type: ignore[arg-type]

    for i in range(5):
        testcaserun_factory(testrun.id, name=f"Case {i}")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(
        _caseruns_url(project.id, testrun.run_uid),
        params={"limit": 2, "offset": 0},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["total_items"] == 5


# ── TestCaseRun: get ─────────────────────────────────────────────────


def test_get_testcaserun_no_project_access(
    client, user_factory, project_factory, testrun_factory,
    testcaserun_factory, override_current_user,
):
    outsider = user_factory("outsider_rt_tcr_get", "outsider_rt_tcr_get@example.com")
    project = project_factory("Project", "desc")
    testrun = testrun_factory(project.id, "run-rt-tcr-get-001")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    override_current_user(outsider)
    resp = client.get(_caserun_url(project.id, testrun.run_uid, testcaserun.id))
    assert resp.status_code == 403


def test_get_testcaserun_as_viewer(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_tcr_get", "viewer_rt_tcr_get@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tcr-get-010")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(
        testrun.id, name="Case A", base_url="https://a.com",  # type: ignore[arg-type]
    )

    override_current_user(viewer)
    resp = client.get(_caserun_url(project.id, testrun.run_uid, testcaserun.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["id"] == testcaserun.id
    assert body["name"] == "Case A"
    assert body["base_url"] == "https://a.com"


def test_get_testcaserun_not_found(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_tcr_nf", "viewer_rt_tcr_nf@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tcr-nf-001")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(_caserun_url(project.id, testrun.run_uid, 99999))
    assert resp.status_code == 404


# ── TestStepRun: list ────────────────────────────────────────────────


def test_list_teststepruns_no_project_access(
    client, user_factory, project_factory, testrun_factory,
    testcaserun_factory, teststeprun_factory, override_current_user,
):
    outsider = user_factory("outsider_rt_tsr_list", "outsider_rt_tsr_list@example.com")
    project = project_factory("Project", "desc")
    testrun = testrun_factory(project.id, "run-rt-tsr-list-001")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "click"})  # type: ignore[arg-type]

    override_current_user(outsider)
    resp = client.get(_stepruns_url(project.id, testrun.run_uid, testcaserun.id))
    assert resp.status_code == 403


def test_list_teststepruns_as_viewer(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, teststeprun_factory,
    override_current_user,
):
    viewer = user_factory("viewer_rt_tsr_list", "viewer_rt_tsr_list@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tsr-list-010")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "click"})  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "type"})  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(_stepruns_url(project.id, testrun.run_uid, testcaserun.id))
    assert resp.status_code == 200

    body = resp.json()
    assert body["total_items"] == 2
    assert len(body["items"]) == 2


def test_list_teststepruns_pagination(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, teststeprun_factory,
    override_current_user,
):
    viewer = user_factory("viewer_rt_tsr_page", "viewer_rt_tsr_page@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tsr-page-001")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    for i in range(5):
        teststeprun_factory(testcaserun.id, executable={"step": i})  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(
        _stepruns_url(project.id, testrun.run_uid, testcaserun.id),
        params={"limit": 2, "offset": 0},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["total_items"] == 5


def test_list_teststepruns_nonexistent_testcaserun(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_tsr_bad", "viewer_rt_tsr_bad@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tsr-bad-001")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(_stepruns_url(project.id, testrun.run_uid, 99999))
    assert resp.status_code == 404


# ── TestStepRun: get ─────────────────────────────────────────────────


def test_get_teststeprun_no_project_access(
    client, user_factory, project_factory, testrun_factory,
    testcaserun_factory, teststeprun_factory, override_current_user,
):
    outsider = user_factory("outsider_rt_tsr_get", "outsider_rt_tsr_get@example.com")
    project = project_factory("Project", "desc")
    testrun = testrun_factory(project.id, "run-rt-tsr-get-001")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun = teststeprun_factory(
        testcaserun.id, executable={"action": "click"},  # type: ignore[arg-type]
    )

    override_current_user(outsider)
    resp = client.get(
        _steprun_url(project.id, testrun.run_uid, testcaserun.id, teststeprun.id),
    )
    assert resp.status_code == 403


def test_get_teststeprun_as_viewer(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, teststeprun_factory,
    override_current_user,
):
    viewer = user_factory("viewer_rt_tsr_get", "viewer_rt_tsr_get@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tsr-get-010")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun = teststeprun_factory(
        testcaserun.id, executable={"action": "click", "selector": "#btn"},  # type: ignore[arg-type]
    )

    override_current_user(viewer)
    resp = client.get(
        _steprun_url(project.id, testrun.run_uid, testcaserun.id, teststeprun.id),
    )
    assert resp.status_code == 200

    body = resp.json()
    assert body["id"] == teststeprun.id
    assert body["testcaserun_id"] == testcaserun.id
    assert body["executable"]["action"] == "click"
    assert body["status"] == TestStatus.PASSED


def test_get_teststeprun_not_found(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, override_current_user,
):
    viewer = user_factory("viewer_rt_tsr_nf", "viewer_rt_tsr_nf@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
    testrun = testrun_factory(project.id, "run-rt-tsr-nf-001")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]

    override_current_user(viewer)
    resp = client.get(
        _steprun_url(project.id, testrun.run_uid, testcaserun.id, 99999),
    )
    assert resp.status_code == 404


# ── Cross-project isolation ──────────────────────────────────────────


def test_cannot_access_testrun_from_other_project(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, override_current_user,
):
    user = user_factory("user_rt_isolation", "user_rt_isolation@example.com")
    project_a = project_factory("Project A", "A")
    project_b = project_factory("Project B", "B")
    project_link_factory(user.id, project_a.id, ProjectRole.VIEWER)
    project_link_factory(user.id, project_b.id, ProjectRole.VIEWER)
    testrun_a = testrun_factory(project_a.id, "run-rt-iso-a", name="Run A")  # type: ignore[arg-type]

    override_current_user(user)

    resp_ok = client.get(_run_url(project_a.id, testrun_a.run_uid))
    assert resp_ok.status_code == 200
    assert resp_ok.json()["id"] == testrun_a.run_uid

    resp_bad = client.get(_run_url(project_b.id, testrun_a.run_uid))
    assert resp_bad.status_code == 404


# ── Cascade delete via API ───────────────────────────────────────────


def test_delete_cascades_children(
    client, user_factory, project_factory, project_link_factory,
    testrun_factory, testcaserun_factory, teststeprun_factory,
    override_current_user,
):
    admin = user_factory("admin_rt_cascade", "admin_rt_cascade@example.com")
    project = project_factory("Project", "desc")
    project_link_factory(admin.id, project.id, ProjectRole.ADMIN)
    testrun = testrun_factory(project.id, "run-rt-cascade-001")  # type: ignore[arg-type]
    testcaserun = testcaserun_factory(testrun.id, name="Case 1")  # type: ignore[arg-type]
    teststeprun_factory(testcaserun.id, executable={"action": "click"})  # type: ignore[arg-type]

    override_current_user(admin)

    resp = client.delete(_run_url(project.id, testrun.run_uid))
    assert resp.status_code == 204

    # Run gone
    assert client.get(_run_url(project.id, testrun.run_uid)).status_code == 404

    # Children gone (parent run not found → 404)
    assert client.get(
        _caseruns_url(project.id, testrun.run_uid),
    ).status_code == 404

    assert client.get(
        _stepruns_url(project.id, testrun.run_uid, testcaserun.id),
    ).status_code == 404