from fastapi.testclient import TestClient

from src.auth.models import Role as AuthRole
from src.auth.service import create_token
from src.auth.schemas import TokenType
from src.projects.models import Role as ProjectRole
from datetime import timedelta

from tests.conftest import make_user, make_project


def auth_header(user_id: int) -> dict[str, str]:
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}



class TestCreateProject:
    def test_admin_creates_project(self, client: TestClient, session):
        admin = make_user(session, username="padmin", email="padmin@x.com", role=AuthRole.ADMIN)
        member = make_user(session, username="pmem", email="pmem@x.com")
        resp = client.post(
            "/api/v1/projects",
            headers=auth_header(admin.id),
            json={
                "name": "New Project",
                "description": "desc",
                "members": [{"user_id": member.id, "role": "editor"}],
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "New Project"
        assert len(body["members"]) == 1

    def test_non_admin_rejected(self, client: TestClient, session):
        viewer = make_user(session, username="pviewer", email="pviewer@x.com", role=AuthRole.VIEWER)
        resp = client.post(
            "/api/v1/projects",
            headers=auth_header(viewer.id),
            json={"name": "Denied"},
        )
        assert resp.status_code == 403



class TestListProjects:
    def test_list_projects(self, client: TestClient, session):
        user = make_user(session, username="plister", email="plister@x.com")
        make_project(session, name="Visible")
        resp = client.get("/api/v1/projects", headers=auth_header(user.id))
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total_items" in body



class TestGetProject:
    def test_project_member_can_view(self, client: TestClient, session):
        user = make_user(session, username="pget1", email="pget1@x.com")
        project = make_project(
            session, name="Viewable",
            members=[(user, ProjectRole.VIEWER)],
        )
        resp = client.get(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Viewable"

    def test_system_admin_can_view_any(self, client: TestClient, session):
        admin = make_user(session, username="padmin2", email="padmin2@x.com", role=AuthRole.ADMIN)
        project = make_project(session, name="AdminView")
        resp = client.get(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(admin.id),
        )
        assert resp.status_code == 200

    def test_non_member_rejected(self, client: TestClient, session):
        outsider = make_user(session, username="outsider", email="outsider@x.com")
        project = make_project(session, name="Private")
        resp = client.get(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(outsider.id),
        )
        assert resp.status_code == 403

    def test_not_found(self, client: TestClient, session):
        user = make_user(session, username="pget404", email="pget404@x.com")
        resp = client.get("/api/v1/projects/9999", headers=auth_header(user.id))
        assert resp.status_code == 404



class TestUpdateProject:
    def test_editor_can_update(self, client: TestClient, session):
        user = make_user(session, username="peditor", email="peditor@x.com")
        project = make_project(
            session, name="Editable",
            members=[(user, ProjectRole.EDITOR)],
        )
        resp = client.put(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(user.id),
            json={"name": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"

    def test_viewer_cannot_update(self, client: TestClient, session):
        user = make_user(session, username="pview_noedit", email="pview_noedit@x.com")
        project = make_project(
            session, name="ReadOnly",
            members=[(user, ProjectRole.VIEWER)],
        )
        resp = client.put(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(user.id),
            json={"name": "Hacked"},
        )
        assert resp.status_code == 403


class TestDeleteProject:
    def test_project_admin_can_delete(self, client: TestClient, session):
        user = make_user(session, username="pdeladmin", email="pdeladmin@x.com")
        project = make_project(
            session, name="Deletable",
            members=[(user, ProjectRole.ADMIN)],
        )
        resp = client.delete(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 204

    def test_system_admin_can_delete_any(self, client: TestClient, session):
        admin = make_user(session, username="sysadmin_del", email="sysadmin_del@x.com", role=AuthRole.ADMIN)
        project = make_project(session, name="SysDelete")
        resp = client.delete(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(admin.id),
        )
        assert resp.status_code == 204

    def test_editor_cannot_delete(self, client: TestClient, session):
        user = make_user(session, username="peditor_nodel", email="peditor_nodel@x.com")
        project = make_project(
            session, name="NoDel",
            members=[(user, ProjectRole.EDITOR)],
        )
        resp = client.delete(
            f"/api/v1/projects/{project.id}",
            headers=auth_header(user.id),
        )
        assert resp.status_code == 403
