import src.auth.router as auth_router
from src.auth.models import Role as UserRole, User
from src.auth.schemas import RefreshTokenResponse, TokensResponse


def test_create_user_route_returns_201(client, monkeypatch, override_current_user):
    override_current_user(User(
        id=1,
        first_name="Admin",
        last_name="User",
        username="admin",
        email="admin@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    ))

    monkeypatch.setattr(
        auth_router,
        "create_user_with_temp_pass",
        lambda *args, **kwargs: (
            User(
                id=9,
                first_name="Jane",
                last_name="Doe",
                username="router_jane",
                email="router_jane@example.com",
                hashed_password="hashed",
                role=UserRole.VIEWER,
                is_active=True,
            ),
            "TmpPass1!",
        ),
    )

    response = client.post(
        "/api/v1/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "router_jane",
            "email": "router_jane@example.com",
            "role": UserRole.VIEWER.value,
        },
    )

    assert response.status_code == 201
    assert response.json()["temporary_password"] == "TmpPass1!"


def test_register_route_removed(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "router_jane",
            "email": "router_jane@example.com",
            "temporary_password": "StrongPass1!",
        },
    )

    assert response.status_code == 404


def test_create_user_route_rejects_invalid_payload(client, override_current_user):
    override_current_user(User(
        id=1,
        first_name="Admin",
        last_name="User",
        username="admin",
        email="admin@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    ))

    response = client.post(
        "/api/v1/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "1bad-name",
            "email": "invalid",
        },
    )

    assert response.status_code == 422


def test_create_user_route_requires_admin(client, override_current_user):
    override_current_user(User(
        id=2,
        first_name="Viewer",
        last_name="User",
        username="viewer",
        email="viewer@example.com",
        hashed_password="hashed",
        role=UserRole.VIEWER,
        is_active=True,
    ))

    response = client.post(
        "/api/v1/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "router_jane2",
            "email": "router_jane2@example.com",
        },
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "You don't have enough permissions"}


def test_regenerate_temporary_password_route_returns_generated_password(client, monkeypatch, override_current_user):
    override_current_user(User(
        id=1,
        first_name="Admin",
        last_name="User",
        username="admin",
        email="admin@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    ))

    monkeypatch.setattr(
        auth_router,
        "regenerate_temporary_password",
        lambda *args, **kwargs: (
            User(
                id=9,
                first_name="Jane",
                last_name="Doe",
                username="regen_jane",
                email="regen_jane@example.com",
                hashed_password="hashed",
                role=UserRole.VIEWER,
                is_active=True,
            ),
            "NewTmp1!Pass",
        ),
    )

    response = client.post("/api/v1/auth/users/9/temporary-password/regenerate")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 9
    assert data["temporary_password"] == "NewTmp1!Pass"


def test_login_route_returns_tokens_and_refresh_cookie(client, monkeypatch):
    monkeypatch.setattr(auth_router, "authenticate_user", lambda *args, **kwargs: object())
    monkeypatch.setattr(
        auth_router,
        "create_tokens",
        lambda *args, **kwargs: TokensResponse(
            access_token="access-token",
            refresh_token="refresh-token",
            token_type="bearer",
            must_change_password=True,
        ),
    )

    response = client.post(
        "/api/v1/auth/tokens",
        json={"username": "login_user", "password": "CorrectPass1!"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
        "token_type": "bearer",
        "must_change_password": True,
    }
    assert "refresh_token=refresh-token" in response.headers.get("set-cookie", "")


def test_login_route_rejects_invalid_payload(client):
    response = client.post(
        "/api/v1/auth/tokens",
        json={"username": "only-username"},
    )

    assert response.status_code == 422


def test_refresh_route_returns_access_token(client, monkeypatch):
    monkeypatch.setattr(
        auth_router,
        "refresh_tokens",
        lambda *args, **kwargs: RefreshTokenResponse(access_token="new-access-token", token_type="bearer"),
    )

    client.cookies.set("refresh_token", "refresh-cookie")
    response = client.post("/api/v1/auth/tokens/refresh")

    assert response.status_code == 200
    assert response.json() == {
        "access_token": "new-access-token",
        "token_type": "bearer",
    }


def test_me_route_returns_current_user_shape(client, override_current_user):
    override_current_user(User(
        id=7,
        first_name="Jane",
        last_name="Doe",
        username="me_user",
        email="me_user@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    ))

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["id"] == 7
    assert response.json()["username"] == "me_user"
    assert response.json()["email"] == "me_user@example.com"


def test_change_password_route_returns_204(client, override_current_user, monkeypatch):
    override_current_user(User(
        id=7,
        first_name="Jane",
        last_name="Doe",
        username="me_user",
        email="me_user@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    ))

    called = {}

    def _change_password(*args, **kwargs):
        called["ok"] = True

    monkeypatch.setattr(auth_router, "change_password", _change_password)

    response = client.post(
        "/api/v1/auth/password/change",
        json={
            "current_password": "OldPass1!",
            "new_password": "NewPass1!",
        },
    )

    assert response.status_code == 204
    assert called.get("ok") is True


def test_must_change_password_user_blocked_from_projects(client, auth_header_factory, user_factory):
    user = user_factory("force_change", "force_change@example.com")
    user.is_temp_pass = True

    response = client.get("/api/v1/projects", headers=auth_header_factory(user))

    assert response.status_code == 403
    assert response.json() == {"detail": "Password change required"}


def test_must_change_password_user_can_access_me(client, auth_header_factory, user_factory):
    user = user_factory("force_change_me", "force_change_me@example.com")
    user.is_temp_pass = True

    response = client.get("/api/v1/auth/me", headers=auth_header_factory(user))

    assert response.status_code == 200
    assert response.json()["username"] == "force_change_me"


def test_list_users_route_non_admin_sees_only_active_users(client, auth_header_factory, user_factory, session):
    requester = user_factory("viewer_requester", "viewer_requester@example.com", role=UserRole.VIEWER)
    active_user = user_factory("active_user", "active_user@example.com", is_active=True)
    inactive_user = user_factory("inactive_user", "inactive_user@example.com", is_active=False)

    response = client.get("/api/v1/users", headers=auth_header_factory(requester))

    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"total_items", "items", "offset", "limit"}
    returned_ids = {item["id"] for item in data["items"]}
    assert requester.id in returned_ids
    assert active_user.id in returned_ids
    assert inactive_user.id not in returned_ids


def test_list_users_route_admin_can_filter_is_active_and_is_temp_pass(client, auth_header_factory, user_factory, session):
    admin = user_factory("admin_list", "admin_list@example.com", role=UserRole.ADMIN)
    inactive_user = user_factory("inactive_list", "inactive_list@example.com", is_active=False)
    temp_user = user_factory("temp_list", "temp_list@example.com", is_active=True)
    temp_user.is_temp_pass = True
    session.add(temp_user)
    session.commit()

    inactive_response = client.get("/api/v1/users", params={"is_active": "false"}, headers=auth_header_factory(admin))
    assert inactive_response.status_code == 200
    inactive_ids = {item["id"] for item in inactive_response.json()["items"]}
    assert inactive_user.id in inactive_ids
    assert temp_user.id not in inactive_ids

    temp_response = client.get("/api/v1/users", params={"is_temp_pass": "true"}, headers=auth_header_factory(admin))
    assert temp_response.status_code == 200
    temp_ids = {item["id"] for item in temp_response.json()["items"]}
    assert temp_user.id in temp_ids
    assert inactive_user.id not in temp_ids


def test_list_users_route_supports_email_username_and_role_filter(client, auth_header_factory, user_factory):
    requester = user_factory("viewer_search", "viewer_search@example.com", role=UserRole.VIEWER)
    user_factory("editor_target", "editor_target@example.com", role=UserRole.EDITOR)
    matching_viewer = user_factory("lookup_viewer", "lookup_viewer@example.com", role=UserRole.VIEWER)

    response = client.get(
        "/api/v1/users",
        params={"username": "lookup", "email": "lookup_viewer@", "role": UserRole.VIEWER.value},
        headers=auth_header_factory(requester),
    )

    assert response.status_code == 200
    rows = response.json()["items"]
    assert len(rows) == 1
    assert rows[0]["id"] == matching_viewer.id


def test_list_users_route_supports_pagination(client, auth_header_factory, user_factory):
    requester = user_factory("viewer_page", "viewer_page@example.com", role=UserRole.VIEWER)
    user_factory("page_a", "page_a@example.com", is_active=True)
    user_factory("page_b", "page_b@example.com", is_active=True)

    response = client.get(
        "/api/v1/users",
        params={"offset": 1, "limit": 1},
        headers=auth_header_factory(requester),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["offset"] == 1
    assert data["limit"] == 1
    assert data["total_items"] >= 3
    assert len(data["items"]) == 1


def test_get_user_route_non_admin_returns_user_read_shape(client, auth_header_factory, user_factory):
    requester = user_factory("viewer_get", "viewer_get@example.com", role=UserRole.VIEWER)
    target = user_factory("target_get", "target_get@example.com", role=UserRole.EDITOR)

    response = client.get(f"/api/v1/users/{target.id}", headers=auth_header_factory(requester))

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == target.id
    assert "is_active" not in data
    assert "is_temp_pass" not in data


def test_get_user_route_admin_returns_admin_user_read_shape(client, auth_header_factory, user_factory):
    admin = user_factory("admin_get", "admin_get@example.com", role=UserRole.ADMIN)
    target = user_factory("target_admin_get", "target_admin_get@example.com", role=UserRole.VIEWER)
    target.is_temp_pass = True

    response = client.get(f"/api/v1/users/{target.id}", headers=auth_header_factory(admin))

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == target.id
    assert data["is_active"] is True
    assert data["is_temp_pass"] is True


def test_delete_user_route_admin_only(client, auth_header_factory, user_factory, session):
    admin = user_factory("admin_delete", "admin_delete@example.com", role=UserRole.ADMIN)
    target = user_factory("target_delete", "target_delete@example.com", role=UserRole.VIEWER)

    response = client.delete(f"/api/v1/users/{target.id}", headers=auth_header_factory(admin))
    assert response.status_code == 204

    session.expire_all()
    assert session.get(User, target.id) is None


def test_delete_user_route_rejects_non_admin(client, auth_header_factory, user_factory):
    requester = user_factory("viewer_delete", "viewer_delete@example.com", role=UserRole.VIEWER)
    target = user_factory("target_non_admin_delete", "target_non_admin_delete@example.com", role=UserRole.VIEWER)

    response = client.delete(f"/api/v1/users/{target.id}", headers=auth_header_factory(requester))
    assert response.status_code == 403


def test_update_user_route_non_admin_can_update_allowed_fields(client, auth_header_factory, user_factory):
    requester = user_factory("viewer_update", "viewer_update@example.com", role=UserRole.VIEWER)

    response = client.put(
        f"/api/v1/users/{requester.id}",
        headers=auth_header_factory(requester),
        json={
            "first_name": "Updated",
            "last_name": "User",
            "username": "viewer_updated",
            "email": "viewer_updated@example.com",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["username"] == "viewer_updated"
    assert data["email"] == "viewer_updated@example.com"
    assert "is_active" not in data
    assert "is_temp_pass" not in data


def test_update_user_route_non_admin_ignores_admin_only_fields(client, auth_header_factory, user_factory, session):
    requester = user_factory("viewer_forbidden", "viewer_forbidden@example.com", role=UserRole.VIEWER)
    requester.is_active = True
    session.add(requester)
    session.commit()

    response = client.put(
        f"/api/v1/users/{requester.id}",
        headers=auth_header_factory(requester),
        json={
            "email": "new_email@example.com",
            "role": UserRole.ADMIN.value,
            "is_active": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new_email@example.com"
    assert data["role"] == UserRole.VIEWER.value

    session.expire_all()
    updated = session.get(User, requester.id)
    assert updated is not None
    assert updated.is_active is True


def test_update_user_route_non_admin_cannot_update_other_users(client, auth_header_factory, user_factory):
    requester = user_factory("viewer_other", "viewer_other@example.com", role=UserRole.VIEWER)
    target = user_factory("target_other", "target_other@example.com", role=UserRole.VIEWER)

    response = client.put(
        f"/api/v1/users/{target.id}",
        headers=auth_header_factory(requester),
        json={"first_name": "Nope"},
    )

    assert response.status_code == 403


def test_update_user_route_admin_can_update_email_role_and_is_active(client, auth_header_factory, user_factory):
    admin = user_factory("admin_update", "admin_update@example.com", role=UserRole.ADMIN)
    target = user_factory("target_admin_update", "target_admin_update@example.com", role=UserRole.VIEWER, is_active=True)

    response = client.put(
        f"/api/v1/users/{target.id}",
        headers=auth_header_factory(admin),
        json={
            "email": "target_updated@example.com",
            "role": UserRole.EDITOR.value,
            "is_active": False,
            "first_name": "AdminSet",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "target_updated@example.com"
    assert data["role"] == UserRole.EDITOR.value
    assert data["is_active"] is False
    assert data["first_name"] == "AdminSet"


def test_update_user_route_admin_cannot_change_is_temp_pass_flag(client, auth_header_factory, user_factory, session):
    admin = user_factory("admin_no_temp", "admin_no_temp@example.com", role=UserRole.ADMIN)
    target = user_factory("target_no_temp", "target_no_temp@example.com", role=UserRole.VIEWER, is_active=True)
    target.is_temp_pass = True
    session.add(target)
    session.commit()

    response = client.put(
        f"/api/v1/users/{target.id}",
        headers=auth_header_factory(admin),
        json={"is_temp_pass": False},
    )

    assert response.status_code == 200
    assert response.json()["is_temp_pass"] is True
