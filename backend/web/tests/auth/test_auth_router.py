import src.auth.router as auth_router
from src.auth.models import Role as UserRole, User
from src.auth.schemas import RefreshTokenResponse, TokensResponse


def test_register_route_returns_201(client, monkeypatch):
    monkeypatch.setattr(auth_router, "register_user", lambda *args, **kwargs: None)

    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "router_jane",
            "email": "router_jane@example.com",
            "password": "StrongPass1!",
        },
    )

    assert response.status_code == 201


def test_register_route_rejects_invalid_payload(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "username": "1bad-name",
            "email": "invalid",
            "password": "short",
        },
    )

    assert response.status_code == 422


def test_login_route_returns_tokens_and_refresh_cookie(client, monkeypatch):
    monkeypatch.setattr(auth_router, "authenticate_user", lambda *args, **kwargs: object())
    monkeypatch.setattr(
        auth_router,
        "create_tokens",
        lambda *args, **kwargs: TokensResponse(
            access_token="access-token",
            refresh_token="refresh-token",
            token_type="bearer",
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
