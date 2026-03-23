from datetime import datetime, UTC

import src.projects.router as projects_router
from src.auth.models import Role as UserRole, User
from src.projects.models import Role as ProjectRole


def _members_from_response(payload: dict) -> list[dict]:
    return payload.get("members") or payload.get("users_links") or []


def _auth_user() -> User:
    return User(
        id=1,
        first_name="Router",
        last_name="Tester",
        username="router_user",
        email="router_user@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    )


def test_list_projects_route_returns_paginated_shape(client, monkeypatch, override_current_user):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        projects_router,
        "list_projects",
        lambda *args, **kwargs: {
            "total_items": 1,
            "items": [
                {
                    "id": 10,
                    "name": "Listable",
                    "description": "Project for listing",
                    "user_role": ProjectRole.VIEWER,
                }
            ],
            "offset": 0,
            "limit": 25,
        },
    )

    response = client.get("/api/v1/projects")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"total_items", "items", "offset", "limit"}
    assert isinstance(body["items"], list)
    assert body["items"][0]["id"] == 10
    assert body["items"][0]["name"] == "Listable"


def test_get_project_route_rejects_invalid_project_id(client, override_current_user):
    override_current_user(_auth_user())
    response = client.get("/api/v1/projects/not-an-int")

    assert response.status_code == 422


def test_get_project_route_returns_project_shape(
    client,
    monkeypatch,
    override_current_user,
):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        projects_router,
        "get_project",
        lambda *args, **kwargs: {
            "id": 22,
            "name": "Readable",
            "description": "Project for get",
            "users_links": [
                {
                    "user": {
                        "id": 1,
                        "first_name": "Router",
                        "last_name": "Tester",
                        "username": "router_user",
                        "email": "router_user@example.com",
                        "role": UserRole.ADMIN,
                    },
                    "role": ProjectRole.VIEWER,
                    "joined_at": datetime.now(UTC).isoformat(),
                }
            ],
        },
    )

    response = client.get("/api/v1/projects/22")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 22
    assert body["name"] == "Readable"
    members = _members_from_response(body)
    assert isinstance(members, list)
    assert members[0]["user"]["id"] == 1


def test_create_project_route_rejects_invalid_body(client, override_current_user):
    override_current_user(_auth_user())

    response = client.post(
        "/api/v1/projects",
        json={"description": "Missing name", "members": []},
    )

    assert response.status_code == 422


def test_create_project_route_returns_created_project(
    client,
    monkeypatch,
    override_current_user,
):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        projects_router,
        "create_project",
        lambda *args, **kwargs: {
            "id": 33,
            "name": "Created",
            "description": "Created via router",
            "users_links": [
                {
                    "user": {
                        "id": 2,
                        "first_name": "Member",
                        "last_name": "User",
                        "username": "member2",
                        "email": "member2@example.com",
                        "role": UserRole.VIEWER,
                    },
                    "role": ProjectRole.EDITOR,
                    "joined_at": datetime.now(UTC).isoformat(),
                }
            ],
        },
    )

    response = client.post(
        "/api/v1/projects",
        json={
            "name": "Created",
            "description": "Created via router",
            "members": [{"user_id": 2, "role": ProjectRole.EDITOR.value}],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Created"
    assert body["description"] == "Created via router"
    members = _members_from_response(body)
    assert len(members) == 1
    assert members[0]["user"]["id"] == 2


def test_update_project_route_returns_updated_project(
    client,
    monkeypatch,
    override_current_user,
):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        projects_router,
        "update_project",
        lambda *args, **kwargs: {
            "id": 44,
            "name": "After",
            "description": "New",
            "users_links": [],
        },
    )

    response = client.put(
        "/api/v1/projects/44",
        json={"name": "After", "description": "New"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 44
    assert body["name"] == "After"
    assert body["description"] == "New"


def test_delete_project_route_returns_204(
    client,
    monkeypatch,
    override_current_user,
):
    override_current_user(_auth_user())

    monkeypatch.setattr(projects_router, "delete_project", lambda *args, **kwargs: None)

    response = client.delete("/api/v1/projects/55")

    assert response.status_code == 204
    assert response.text == ""
