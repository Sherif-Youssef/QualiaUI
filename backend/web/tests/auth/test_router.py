import pytest
from fastapi.testclient import TestClient

from src.auth.models import Role
from src.auth.service import create_token
from src.auth.schemas import TokenType
from datetime import timedelta

from tests.conftest import make_user


def auth_header(user_id: int) -> dict[str, str]:
    """Build an Authorization header with a valid access token."""
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}



class TestLogin:
    def test_login_success(self, client: TestClient, session):
        make_user(session, username="loginuser", email="login@x.com", password="Pass1234!")
        resp = client.post("/api/v1/auth/tokens", json={
            "username": "loginuser", "password": "Pass1234!",
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body

    def test_login_wrong_password(self, client: TestClient, session):
        make_user(session, username="loginuser2", email="login2@x.com", password="Pass1234!")
        resp = client.post("/api/v1/auth/tokens", json={
            "username": "loginuser2", "password": "Wrong1234!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient):
        resp = client.post("/api/v1/auth/tokens", json={
            "username": "ghost", "password": "Pass1234!",
        })
        assert resp.status_code == 401


class TestMe:
    def test_me_success(self, client: TestClient, session):
        user = make_user(session, username="meuser", email="me@x.com")
        resp = client.get("/api/v1/auth/me", headers=auth_header(user.id))
        assert resp.status_code == 200
        assert resp.json()["username"] == "meuser"

    def test_me_no_auth(self, client: TestClient):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401



class TestRefreshToken:
    def test_refresh_success(self, client: TestClient, session):
        user = make_user(session, username="refuser", email="ref@x.com")
        refresh = create_token(user.id, TokenType.REFRESH, timedelta(minutes=60))
        client.cookies.set("refresh_token", refresh)
        resp = client.post("/api/v1/auth/tokens/refresh")
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_missing_cookie(self, client: TestClient):
        resp = client.post("/api/v1/auth/tokens/refresh")
        assert resp.status_code == 401



class TestChangePassword:
    def test_change_password_success(self, client: TestClient, session):
        user = make_user(
            session, username="pwuser", email="pw@x.com",
            password="Old1234!", is_temp_pass=True,
        )
        resp = client.post(
            "/api/v1/auth/password/change",
            headers=auth_header(user.id),
            json={"current_password": "Old1234!", "new_password": "New1234!"},
        )
        assert resp.status_code == 204

    def test_change_password_wrong_current(self, client: TestClient, session):
        user = make_user(
            session, username="pwuser2", email="pw2@x.com",
            password="Old1234!",
        )
        resp = client.post(
            "/api/v1/auth/password/change",
            headers=auth_header(user.id),
            json={"current_password": "Wrong1234!", "new_password": "New1234!"},
        )
        assert resp.status_code == 401


class TestCreateUser:
    def test_admin_creates_user(self, client: TestClient, session):
        admin = make_user(
            session, username="admin1", email="admin1@x.com",
            role=Role.ADMIN,
        )
        resp = client.post(
            "/api/v1/users",
            headers=auth_header(admin.id),
            json={
                "first_name": "New", "last_name": "User",
                "username": "created", "email": "created@x.com",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["username"] == "created"
        assert "temporary_password" in body

    def test_non_admin_rejected(self, client: TestClient, session):
        viewer = make_user(session, username="viewer1", email="viewer1@x.com", role=Role.VIEWER)
        resp = client.post(
            "/api/v1/users",
            headers=auth_header(viewer.id),
            json={
                "first_name": "New", "last_name": "User",
                "username": "denied", "email": "denied@x.com",
            },
        )
        assert resp.status_code == 403



class TestListUsers:
    def test_list_users(self, client: TestClient, session):
        user = make_user(session, username="lister", email="lister@x.com")
        resp = client.get("/api/v1/users", headers=auth_header(user.id))
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total_items" in body



class TestGetUser:
    def test_get_user(self, client: TestClient, session):
        user = make_user(session, username="getter", email="getter@x.com")
        resp = client.get(f"/api/v1/users/{user.id}", headers=auth_header(user.id))
        assert resp.status_code == 200
        assert resp.json()["username"] == "getter"

    def test_get_nonexistent(self, client: TestClient, session):
        user = make_user(session, username="getter2", email="getter2@x.com")
        resp = client.get("/api/v1/users/9999", headers=auth_header(user.id))
        assert resp.status_code == 404



class TestDeleteUser:
    def test_admin_deletes_user(self, client: TestClient, session):
        admin = make_user(session, username="admin2", email="admin2@x.com", role=Role.ADMIN)
        target = make_user(session, username="todelete", email="del@x.com")
        resp = client.delete(f"/api/v1/users/{target.id}", headers=auth_header(admin.id))
        assert resp.status_code == 204

    def test_non_admin_rejected(self, client: TestClient, session):
        viewer = make_user(session, username="viewer2", email="viewer2@x.com", role=Role.VIEWER)
        target = make_user(session, username="todelete2", email="del2@x.com")
        resp = client.delete(f"/api/v1/users/{target.id}", headers=auth_header(viewer.id))
        assert resp.status_code == 403



class TestUpdateUser:
    def test_self_update(self, client: TestClient, session):
        user = make_user(session, username="updater", email="upd@x.com")
        resp = client.put(
            f"/api/v1/users/{user.id}",
            headers=auth_header(user.id),
            json={"first_name": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Updated"

    def test_non_admin_cannot_update_other(self, client: TestClient, session):
        user = make_user(session, username="updater2", email="upd2@x.com", role=Role.VIEWER)
        other = make_user(session, username="other", email="other@x.com")
        resp = client.put(
            f"/api/v1/users/{other.id}",
            headers=auth_header(user.id),
            json={"first_name": "Hacked"},
        )
        assert resp.status_code == 403

    def test_admin_updates_role(self, client: TestClient, session):
        admin = make_user(session, username="admin3", email="admin3@x.com", role=Role.ADMIN)
        target = make_user(session, username="target", email="target@x.com", role=Role.VIEWER)
        resp = client.put(
            f"/api/v1/users/{target.id}",
            headers=auth_header(admin.id),
            json={"role": "editor"},
        )
        assert resp.status_code == 200
