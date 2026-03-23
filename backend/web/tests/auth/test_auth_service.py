from datetime import timedelta

import pytest
from fastapi import HTTPException

from src.auth.schemas import TokenType, UserCreate
from src.auth.exceptions import InvalidTokenTypeError
from src.auth.service import (
    authenticate_user,
    create_token,
    create_tokens,
    decode_token,
    hash_password,
    refresh_tokens,
    register_user,
)


def _user_create_payload(
    username: str,
    email: str,
    password: str = "StrongPass1!",
) -> UserCreate:
    return UserCreate(
        first_name="Jane",
        last_name="Doe",
        username=username,
        email=email,
        password=password,
    )


def test_register_and_authenticate_user(session):
    user_create = _user_create_payload("jane_doe", "jane@example.com")

    created = register_user(session, user_create)

    assert created.id is not None
    assert created.username == "jane_doe"
    assert created.hashed_password != user_create.password

    authenticated = authenticate_user(session, "jane_doe", "StrongPass1!")
    assert authenticated.id == created.id

    authenticated_by_email = authenticate_user(session, "jane@example.com", "StrongPass1!")
    assert authenticated_by_email.id == created.id


def test_authenticate_user_invalid_password_raises_401(session, user_factory):
    user = user_factory("mike", "mike@example.com")
    user.hashed_password = hash_password("CorrectPass1!")
    session.add(user)
    session.commit()

    with pytest.raises(HTTPException) as exc:
        authenticate_user(session, "mike", "WrongPass1!")

    assert exc.value.status_code == 401


def test_create_and_refresh_tokens(session):
    created = register_user(session, _user_create_payload("ana_bell", "ana@example.com", "SecurePwd1!"))

    tokens = create_tokens(created)

    assert tokens.access_token
    assert tokens.refresh_token
    assert tokens.token_type == "bearer"

    payload = decode_token(tokens.access_token, expected_type=TokenType.ACCESS)
    assert payload.user_id == created.id

    refreshed = refresh_tokens(session, tokens.refresh_token)
    assert refreshed.access_token
    assert refreshed.token_type == "bearer"


def test_register_user_duplicate_username_raises_400(session):
    register_user(session, _user_create_payload("dup_name", "first@example.com"))

    with pytest.raises(HTTPException) as exc:
        register_user(session, _user_create_payload("dup_name", "second@example.com"))

    assert exc.value.status_code == 400
    assert exc.value.detail == "User with this username already exists"


def test_register_user_duplicate_email_raises_400(session):
    register_user(session, _user_create_payload("first_user", "dup@example.com"))

    with pytest.raises(HTTPException) as exc:
        register_user(session, _user_create_payload("second_user", "dup@example.com"))

    assert exc.value.status_code == 400
    assert exc.value.detail == "User with this email already exists"


def test_authenticate_unknown_user_raises_401(session):
    with pytest.raises(HTTPException) as exc:
        authenticate_user(session, "missing_user", "AnyPass1!")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid credentials"


def test_authenticate_inactive_user_raises_403(session, user_factory):
    inactive_user = user_factory("inactive", "inactive@example.com", is_active=False)
    inactive_user.hashed_password = hash_password("CorrectPass1!")
    session.add(inactive_user)
    session.commit()

    with pytest.raises(HTTPException) as exc:
        authenticate_user(session, "inactive", "CorrectPass1!")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Inactive user"


def test_decode_token_expected_type_mismatch_raises():
    access_token = create_token(user_id=1, token_type=TokenType.ACCESS, expires_delta=timedelta(minutes=5))

    with pytest.raises(InvalidTokenTypeError):
        decode_token(access_token, expected_type=TokenType.REFRESH)


def test_refresh_tokens_with_invalid_token_raises_401(session):
    with pytest.raises(HTTPException) as exc:
        refresh_tokens(session, "not-a-valid-jwt")

    assert exc.value.status_code == 401


def test_refresh_tokens_for_inactive_user_raises_400(session, user_factory):
    user = user_factory("inactive_rt", "inactive_rt@example.com", is_active=False)
    tokens = create_tokens(user)

    with pytest.raises(HTTPException) as exc:
        refresh_tokens(session, tokens.refresh_token)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Inactive user."
