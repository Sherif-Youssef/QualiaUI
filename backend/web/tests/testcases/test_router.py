from fastapi.testclient import TestClient

from src.auth.models import Role as AuthRole
from src.auth.service import create_token
from src.auth.schemas import TokenType
from src.projects.models import Role as ProjectRole
from datetime import timedelta

from tests.conftest import make_user, make_project, make_testsuite, make_testcase


def auth_header(user_id: int) -> dict[str, str]:
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}



class TestListTestCases:
    def test_viewer_can_list(self, client: TestClient, session):
        user = make_user(session, username="tc_lister", email="tc_lister@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="TS")
        make_testcase(session, ts, name="TC A")
        make_testcase(session, ts, name="TC B")

        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_items"] == 2

    def test_non_member_rejected(self, client: TestClient, session):
        outsider = make_user(session, username="tc_out", email="tc_out@x.com")
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        
        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases",
            headers=auth_header(outsider.id),
        )
        assert resp.status_code == 403



class TestGetTestCase:
    def test_viewer_can_get(self, client: TestClient, session):
        user = make_user(session, username="tc_getter", email="tc_getter@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="My TC")

        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "My TC"

    def test_not_found(self, client: TestClient, session):
        user = make_user(session, username="tc_nf", email="tc_nf@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="TS")
        
        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/9999",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 404

    def test_system_admin_can_get_any(self, client: TestClient, session):
        admin = make_user(session, username="tc_sysadm", email="tc_sysadm@x.com", role=AuthRole.ADMIN)
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="AdminTC")
        
        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}",
            headers=auth_header(admin.id),
        )
        assert resp.status_code == 200


class TestCreateTestCase:
    def test_editor_can_create(self, client: TestClient, session):
        user = make_user(session, username="tc_editor", email="tc_editor@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="TS")

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases",
            headers=auth_header(user.id),
            json={
                "name": "New TC", 
                "base_url": "http://x.com", 
                "instruction": "Run"
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "New TC"
        assert body["testsuite_id"] == ts.id

    def test_viewer_cannot_create(self, client: TestClient, session):
        user = make_user(session, username="tc_view_nocreate", email="tc_vnc@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="TS")

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases",
            headers=auth_header(user.id),
            json={
                "name": "Denied TC", 
                "base_url": "http://x.com", 
                "instruction": "Run"
            },
        )
        assert resp.status_code == 403


class TestUpdateTestCase:
    def test_editor_can_update(self, client: TestClient, session):
        user = make_user(session, username="tc_upd", email="tc_upd@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="Old Name")

        resp = client.put(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}",
            headers=auth_header(user.id),
            json={"name": "New Name"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_viewer_cannot_update(self, client: TestClient, session):
        user = make_user(session, username="tc_view_noupd", email="tc_vnu@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="TC")

        resp = client.put(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}",
            headers=auth_header(user.id),
            json={"name": "Hacked"},
        )
        assert resp.status_code == 403



class TestDeleteTestCase:
    def test_project_admin_can_delete(self, client: TestClient, session):
        user = make_user(session, username="tc_deladm", email="tc_deladm@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.ADMIN)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="ToDelete")

        resp = client.delete(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 204

    def test_editor_cannot_delete(self, client: TestClient, session):
        user = make_user(session, username="tc_edit_nodel", email="tc_end@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="TC")

        resp = client.delete(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 403


class TestCookieRoutes:
    def _cookie_payload(self) -> dict:
        return {"name": "session", "value": "abc123", "domain": "example.com"}

    def test_add_cookie(self, client: TestClient, session):
        user = make_user(session, username="tcck_add", email="tcck_add@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="TC")

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "session"

    def test_update_cookie(self, client: TestClient, session):
        user = make_user(session, username="tcck_upd", email="tcck_upd@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="TC")

        # add first
        add_resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        cookie_id = add_resp.json()["id"]

        # then update
        resp = client.put(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}/cookies/{cookie_id}",
            headers=auth_header(user.id),
            json={"name": "session", "value": "new_value", "domain": "example.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["value"] == "new_value"

    def test_delete_cookie(self, client: TestClient, session):
        user = make_user(session, username="tcck_del", email="tcck_del@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="TC")

        add_resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        cookie_id = add_resp.json()["id"]

        resp = client.delete(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}/cookies/{cookie_id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 204

    def test_viewer_cannot_add_cookie(self, client: TestClient, session):
        user = make_user(session, username="tcck_view", email="tcck_view@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="TS")
        tc = make_testcase(session, ts, name="TC")

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/testcases/{tc.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        assert resp.status_code == 403
