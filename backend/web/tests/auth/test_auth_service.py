from datetime import timedelta

import pytest
from fastapi import HTTPException

from src.auth.models import Role as UserRole
from src.auth.schemas import UserCreate, TokenType
from src.auth.exceptions import InvalidTokenTypeError
from src.auth.service import (
    authenticate_user,
    change_password,
    create_user,
    create_user_with_temp_pass,
    create_token,
    create_tokens,
    decode_token,
    hash_password,
    regenerate_temporary_password,
    refresh_tokens,
)


def _admin_user_create_payload(
    username: str,
    email: str,
) -> UserCreate:
    return UserCreate(
        first_name="Jane",
        last_name="Doe",
        username=username,
        email=email,
    )


def test_create_user_by_admin_and_authenticate_user(session, user_factory):
    user_create = _admin_user_create_payload("jane_doe", "jane@example.com")

    created, temporary_password = create_user_with_temp_pass(session, user_create)

    assert created.id is not None
    assert created.username == "jane_doe"
    assert created.hashed_password != temporary_password
    assert created.is_temp_pass is True

    authenticated = authenticate_user(session, "jane_doe", temporary_password)
    assert authenticated.id == created.id

    authenticated_by_email = authenticate_user(session, "jane@example.com", temporary_password)
    assert authenticated_by_email.id == created.id


def test_authenticate_user_invalid_password_raises_401(session, user_factory):
    user = user_factory("mike", "mike@example.com")
    user.hashed_password = hash_password("CorrectPass1!")
    session.add(user)
    session.commit()

    with pytest.raises(HTTPException) as exc:
        authenticate_user(session, "mike", "WrongPass1!")

    assert exc.value.status_code == 401


def test_create_and_refresh_tokens(session, user_factory):
    created, _ = create_user_with_temp_pass(session, _admin_user_create_payload("ana_bell", "ana@example.com"))

    tokens = create_tokens(created)

    assert tokens.access_token
    assert tokens.refresh_token
    assert tokens.token_type == "bearer"
    assert tokens.must_change_password is True

    payload = decode_token(tokens.access_token, expected_type=TokenType.ACCESS)
    assert payload.user_id == created.id

    refreshed = refresh_tokens(session, tokens.refresh_token)
    assert refreshed.access_token
    assert refreshed.token_type == "bearer"


def test_create_user_by_admin_duplicate_username_raises_400(session, user_factory):
    create_user_with_temp_pass(session, _admin_user_create_payload("dup_name", "first@example.com"))

    with pytest.raises(HTTPException) as exc:
        create_user_with_temp_pass(session, _admin_user_create_payload("dup_name", "second@example.com"))

    assert exc.value.status_code == 400
    assert exc.value.detail == "User with this username already exists"


def test_create_user_by_admin_duplicate_email_raises_400(session, user_factory):
    create_user_with_temp_pass(session, _admin_user_create_payload("first_user", "dup@example.com"))

    with pytest.raises(HTTPException) as exc:
        create_user_with_temp_pass(session, _admin_user_create_payload("second_user", "dup@example.com"))

    assert exc.value.status_code == 400
    assert exc.value.detail == "User with this email already exists"


def test_create_user_with_temp_pass_returns_temporary_password(session):
    created, temporary_password = create_user_with_temp_pass(
        session,
        _admin_user_create_payload("new_user", "new_user@example.com"),
    )

    assert created.id is not None
    assert created.hashed_password != temporary_password


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


def test_change_password_success_clears_force_flag(session, user_factory):
    user = user_factory("pwd_user", "pwd_user@example.com")
    user.hashed_password = hash_password("CurrentPass1!")
    user.is_temp_pass = True
    session.add(user)
    session.commit()
    session.refresh(user)

    change_password(
        session=session,
        user=user,
        current_password="CurrentPass1!",
        new_password="UpdatedPass1!",
    )

    session.refresh(user)
    assert user.is_temp_pass is False

    authenticated = authenticate_user(session, "pwd_user", "UpdatedPass1!")
    assert authenticated.id == user.id


def test_regenerate_temporary_password_by_admin_success(session, user_factory):
    admin_user = user_factory("admin_regen", "admin_regen@example.com", role=UserRole.ADMIN)
    created_user, old_temporary_password = create_user_with_temp_pass(session, _admin_user_create_payload("regen_user", "regen_user@example.com"))

    user, new_temporary_password = regenerate_temporary_password(session, created_user.id)  # pyright: ignore[reportArgumentType]

    assert new_temporary_password != old_temporary_password
    authenticated = authenticate_user(session, "regen_user", new_temporary_password)
    assert authenticated.id == created_user.id


def test_regenerate_temporary_password_by_admin_rejects_user_who_changed_password(session, user_factory):
    admin_user = user_factory("admin_regen2", "admin_regen2@example.com", role=UserRole.ADMIN)
    created_user, temporary_password = create_user_with_temp_pass(session, _admin_user_create_payload("changed_user", "changed_user@example.com"))

    change_password(
        session=session,
        user=created_user,
        current_password=temporary_password,
        new_password="UpdatedPass1!",
    )

    with pytest.raises(HTTPException) as exc:
        regenerate_temporary_password(session, created_user.id)  # pyright: ignore[reportArgumentType]

    assert exc.value.status_code == 400
    assert exc.value.detail == "Temporary password can be regenerated only before the user changes password"


def test_change_password_with_invalid_current_password_raises_401(session, user_factory):
    user = user_factory("pwd_user2", "pwd_user2@example.com")
    user.hashed_password = hash_password("CurrentPass1!")
    session.add(user)
    session.commit()

    with pytest.raises(HTTPException) as exc:
        change_password(
            session=session,
            user=user,
            current_password="WrongPass1!",
            new_password="UpdatedPass1!",
        )

    assert exc.value.status_code == 401
    assert exc.value.detail == "Current password is incorrect"


def test_change_password_rejects_same_password(session, user_factory):
    user = user_factory("pwd_user3", "pwd_user3@example.com")
    user.hashed_password = hash_password("CurrentPass1!")
    session.add(user)
    session.commit()

    with pytest.raises(HTTPException) as exc:
        change_password(
            session=session,
            user=user,
            current_password="CurrentPass1!",
            new_password="CurrentPass1!",
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "New password must be different from current password"


def test_create_admin_account_success(session):
    created = create_user(
        session=session,
        user_create=UserCreate(
            first_name="Super",
            last_name="Admin",
            username="superadmin",
            email="superadmin@example.com",
            role=UserRole.ADMIN,
            is_active=True,
        ),
        password="StrongAdmin1!",
        is_temp_pass=False,
    )

    assert created.id is not None
    assert created.role == UserRole.ADMIN
    assert created.is_active is True
    assert created.is_temp_pass is False

    authenticated = authenticate_user(session, "superadmin", "StrongAdmin1!")
    assert authenticated.id == created.id