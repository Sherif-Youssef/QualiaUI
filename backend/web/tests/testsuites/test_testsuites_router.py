import src.testsuites.router as testsuites_router
from src.auth.models import Role as UserRole, User


def _auth_user() -> User:
    return User(
        id=1,
        first_name="Router",
        last_name="Tester",
        username="router_suite_user",
        email="router_suite_user@example.com",
        hashed_password="hashed",
        role=UserRole.ADMIN,
        is_active=True,
    )


def test_list_testsuites_route_returns_paginated_shape(client, monkeypatch, override_current_user):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        testsuites_router,
        "list_testsuites",
        lambda *args, **kwargs: {
            "total_items": 1,
            "items": [
                {
                    "id": 10,
                    "project_id": 2,
                    "name": "Regression",
                    "description": "Regression suite",
                }
            ],
            "offset": 0,
            "limit": 25,
        },
    )

    response = client.get("/api/v1/projects/2/testsuites")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"total_items", "items", "offset", "limit"}
    assert isinstance(body["items"], list)
    assert body["items"][0]["id"] == 10


def test_get_testsuite_route_rejects_invalid_id(client, override_current_user):
    override_current_user(_auth_user())

    response = client.get("/api/v1/projects/1/testsuites/not-an-int")

    assert response.status_code == 422


def test_get_testsuite_route_returns_testsuite_shape(client, monkeypatch, override_current_user):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        testsuites_router,
        "get_testsuite",
        lambda *args, **kwargs: {
            "id": 7,
            "project_id": 1,
            "name": "Smoke",
            "description": "Fast checks",
        },
    )

    response = client.get("/api/v1/projects/1/testsuites/7")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 7
    assert body["project_id"] == 1
    assert body["name"] == "Smoke"


def test_create_testsuite_route_rejects_invalid_body(client, override_current_user):
    override_current_user(_auth_user())

    response = client.post(
        "/api/v1/projects/1/testsuites",
        json={"description": "Missing name"},
    )

    assert response.status_code == 422


def test_create_testsuite_route_returns_created_testsuite(client, monkeypatch, override_current_user):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        testsuites_router,
        "create_testsuite",
        lambda *args, **kwargs: {
            "id": 9,
            "project_id": 1,
            "name": "Created",
            "description": "Created via router",
        },
    )

    response = client.post(
        "/api/v1/projects/1/testsuites",
        json={"name": "Created", "description": "Created via router"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 9
    assert body["name"] == "Created"
    assert body["project_id"] == 1


def test_update_testsuite_route_returns_updated_testsuite(client, monkeypatch, override_current_user):
    override_current_user(_auth_user())

    monkeypatch.setattr(
        testsuites_router,
        "update_testsuite",
        lambda *args, **kwargs: {
            "id": 11,
            "project_id": 1,
            "name": "After",
            "description": "New",
        },
    )

    response = client.put(
        "/api/v1/projects/1/testsuites/11",
        json={"name": "After", "description": "New"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 11
    assert body["name"] == "After"


def test_delete_testsuite_route_returns_204(client, monkeypatch, override_current_user):
    override_current_user(_auth_user())

    monkeypatch.setattr(testsuites_router, "delete_testsuite", lambda *args, **kwargs: None)

    response = client.delete("/api/v1/projects/1/testsuites/3")

    assert response.status_code == 204
    assert response.text == ""
