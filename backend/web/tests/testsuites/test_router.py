from fastapi.testclient import TestClient

from src.auth.models import Role as AuthRole
from src.auth.service import create_token
from src.auth.schemas import TokenType
from src.projects.models import Role as ProjectRole
from src.base.schemas import Cookie as CookieSchema
from datetime import timedelta

from tests.conftest import make_user, make_project, make_testsuite


def auth_header(user_id: int) -> dict[str, str]:
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}



class TestListTestSuites:
    def test_viewer_can_list(self, client: TestClient, session):
        user = make_user(session, username="ts_lister", email="ts_lister@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        make_testsuite(session, project, name="Suite A")
        make_testsuite(session, project, name="Suite B")

        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_items"] == 2

    def test_non_member_rejected(self, client: TestClient, session):
        outsider = make_user(session, username="ts_out", email="ts_out@x.com")
        project = make_project(session, name="P")
        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites",
            headers=auth_header(outsider.id),
        )
        assert resp.status_code == 403



class TestGetTestSuite:
    def test_viewer_can_get(self, client: TestClient, session):
        user = make_user(session, username="ts_getter", email="ts_getter@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="My Suite")

        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "My Suite"

    def test_not_found(self, client: TestClient, session):
        user = make_user(session, username="ts_nf", email="ts_nf@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/9999",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 404

    def test_system_admin_can_get_any(self, client: TestClient, session):
        admin = make_user(session, username="ts_sysadm", email="ts_sysadm@x.com", role=AuthRole.ADMIN)
        project = make_project(session, name="P")
        ts = make_testsuite(session, project, name="AdminSuite")
        resp = client.get(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}",
            headers=auth_header(admin.id),
        )
        assert resp.status_code == 200



class TestCreateTestSuite:
    def test_editor_can_create(self, client: TestClient, session):
        user = make_user(session, username="ts_editor", email="ts_editor@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites",
            headers=auth_header(user.id),
            json={"name": "New Suite", "description": "desc"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "New Suite"
        assert body["project_id"] == project.id

    def test_viewer_cannot_create(self, client: TestClient, session):
        user = make_user(session, username="ts_view_nocreate", email="ts_vnc@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites",
            headers=auth_header(user.id),
            json={"name": "Denied"},
        )
        assert resp.status_code == 403




class TestUpdateTestSuite:
    def test_editor_can_update(self, client: TestClient, session):
        user = make_user(session, username="ts_upd", email="ts_upd@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="Old Name")

        resp = client.put(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}",
            headers=auth_header(user.id),
            json={"name": "New Name"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_viewer_cannot_update(self, client: TestClient, session):
        user = make_user(session, username="ts_view_noupd", email="ts_vnu@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project, name="Suite")

        resp = client.put(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}",
            headers=auth_header(user.id),
            json={"name": "Hacked"},
        )
        assert resp.status_code == 403



class TestDeleteTestSuite:
    def test_project_admin_can_delete(self, client: TestClient, session):
        user = make_user(session, username="ts_deladm", email="ts_deladm@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.ADMIN)])
        ts = make_testsuite(session, project, name="ToDelete")

        resp = client.delete(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 204

    def test_editor_cannot_delete(self, client: TestClient, session):
        user = make_user(session, username="ts_edit_nodel", email="ts_end@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project, name="Suite")

        resp = client.delete(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 403



class TestCookieRoutes:
    def _cookie_payload(self) -> dict:
        return {"name": "session", "value": "abc123", "domain": "example.com"}

    def test_add_cookie(self, client: TestClient, session):
        user = make_user(session, username="ck_add", email="ck_add@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project)

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "session"

    def test_update_cookie(self, client: TestClient, session):
        user = make_user(session, username="ck_upd", email="ck_upd@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project)

        # add first
        add_resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        cookie_id = add_resp.json()["id"]

        # then update
        resp = client.put(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/cookies/{cookie_id}",
            headers=auth_header(user.id),
            json={"name": "session", "value": "new_value", "domain": "example.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["value"] == "new_value"

    def test_delete_cookie(self, client: TestClient, session):
        user = make_user(session, username="ck_del", email="ck_del@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project)

        add_resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        cookie_id = add_resp.json()["id"]

        resp = client.delete(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/cookies/{cookie_id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 204

    def test_viewer_cannot_add_cookie(self, client: TestClient, session):
        user = make_user(session, username="ck_view", email="ck_view@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project)

        resp = client.post(
            f"/api/v1/projects/{project.id}/testsuites/{ts.id}/cookies",
            headers=auth_header(user.id),
            json=self._cookie_payload(),
        )
        assert resp.status_code == 403
