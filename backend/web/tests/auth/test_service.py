"""Unit tests for src.auth.service — pure functions and DB-backed logic."""

import pytest

from src.auth.models import Role
from src.auth.schemas import TokenType
from src.auth.service import (
    validate_password,
    validate_username,
    hash_password,
    verify_password,
    generate_temporary_password,
    create_token,
    decode_token,
    authenticate_user,
    create_user_with_temp_pass,
    change_password,
    regenerate_temporary_password,
)
from src.auth.schemas import UserCreate
from src.auth.exceptions import InvalidTokenError, InvalidTokenTypeError, ExpiredTokenError
from fastapi import HTTPException
from datetime import timedelta

from tests.conftest import make_user


# ===================================================================
# validate_password
# ===================================================================


class TestValidatePassword:
    def test_valid_password(self):
        validate_password("Test1234!")  # should not raise

    def test_too_short(self):
        with pytest.raises(ValueError, match="at least 8"):
            validate_password("Te1!")

    def test_too_long(self):
        with pytest.raises(ValueError, match="at most 128"):
            validate_password("A" * 129 + "a1!")

    def test_no_uppercase(self):
        with pytest.raises(ValueError, match="uppercase"):
            validate_password("test1234!")

    def test_no_lowercase(self):
        with pytest.raises(ValueError, match="lowercase"):
            validate_password("TEST1234!")

    def test_no_digit(self):
        with pytest.raises(ValueError, match="digit"):
            validate_password("TestTest!")

    def test_no_special_char(self):
        with pytest.raises(ValueError, match="special"):
            validate_password("Test1234x")


# ===================================================================
# validate_username
# ===================================================================


class TestValidateUsername:
    def test_valid_username(self):
        validate_username("john_doe")

    def test_blank(self):
        with pytest.raises(ValueError, match="blank"):
            validate_username("")

    def test_too_long(self):
        with pytest.raises(ValueError, match="at most 20"):
            validate_username("a" * 21)

    def test_starts_with_digit(self):
        with pytest.raises(ValueError, match="start with a digit"):
            validate_username("1user")

    def test_special_characters(self):
        with pytest.raises(ValueError, match="letters, digits, and underscores"):
            validate_username("user@name")


# ===================================================================
# Password hashing
# ===================================================================


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = hash_password("Test1234!")
        assert hashed != "Test1234!"
        assert verify_password("Test1234!", hashed)

    def test_wrong_password_fails(self):
        hashed = hash_password("Test1234!")
        assert not verify_password("WrongPass1!", hashed)


# ===================================================================
# generate_temporary_password
# ===================================================================


class TestGenerateTemporaryPassword:
    def test_meets_length(self):
        pwd = generate_temporary_password(12)
        assert len(pwd) == 12

    def test_passes_validation(self):
        """Generated passwords should always satisfy the password policy."""
        pwd = generate_temporary_password()
        validate_password(pwd)  # should not raise

    def test_too_short_raises(self):
        with pytest.raises(ValueError, match="at least 8"):
            generate_temporary_password(4)


# ===================================================================
# Tokens
# ===================================================================


class TestTokens:
    def test_create_and_decode(self):
        token = create_token(user_id=1, token_type=TokenType.ACCESS, expires_delta=timedelta(minutes=15))
        payload = decode_token(token, expected_type=TokenType.ACCESS)
        assert payload.user_id == 1
        assert payload.type == TokenType.ACCESS

    def test_wrong_type_raises(self):
        token = create_token(user_id=1, token_type=TokenType.REFRESH, expires_delta=timedelta(minutes=15))
        with pytest.raises(InvalidTokenTypeError):
            decode_token(token, expected_type=TokenType.ACCESS)

    def test_expired_token_raises(self):
        token = create_token(user_id=1, token_type=TokenType.ACCESS, expires_delta=timedelta(seconds=-1))
        with pytest.raises(ExpiredTokenError):
            decode_token(token, expected_type=TokenType.ACCESS)

    def test_garbage_token_raises(self):
        with pytest.raises(InvalidTokenError):
            decode_token("not.a.real.token")


# ===================================================================
# authenticate_user (requires DB)
# ===================================================================


class TestAuthenticateUser:
    def test_success_by_username(self, session):
        make_user(session, username="alice", email="alice@x.com", password="Pass1234!")
        user = authenticate_user(session, "alice", "Pass1234!")
        assert user.username == "alice"

    def test_success_by_email(self, session):
        make_user(session, username="bob", email="bob@x.com", password="Pass1234!")
        user = authenticate_user(session, "bob@x.com", "Pass1234!")
        assert user.email == "bob@x.com"

    def test_wrong_password(self, session):
        make_user(session, username="charlie", email="charlie@x.com", password="Pass1234!")
        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(session, "charlie", "WrongPass1!")
        assert exc_info.value.status_code == 401

    def test_nonexistent_user(self, session):
        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(session, "nobody", "Pass1234!")
        assert exc_info.value.status_code == 401

    def test_inactive_user(self, session):
        make_user(session, username="inactive", email="inactive@x.com", password="Pass1234!", is_active=False)
        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(session, "inactive", "Pass1234!")
        assert exc_info.value.status_code == 403


# ===================================================================
# create_user_with_temp_pass (requires DB)
# ===================================================================


class TestCreateUserWithTempPass:
    def test_creates_user(self, session):
        user_data = UserCreate(
            first_name="New", last_name="User",
            username="newuser", email="new@x.com",
        )
        user, temp_pass = create_user_with_temp_pass(session, user_data)
        assert user.id is not None
        assert user.is_temp_pass is True
        assert verify_password(temp_pass, user.hashed_password)

    def test_duplicate_username_raises(self, session):
        make_user(session, username="dupeuser", email="dupe1@x.com")
        user_data = UserCreate(
            first_name="Dupe", last_name="User",
            username="dupeuser", email="dupe2@x.com",
        )
        with pytest.raises(HTTPException) as exc_info:
            create_user_with_temp_pass(session, user_data)
        assert exc_info.value.status_code == 400


# ===================================================================
# change_password (requires DB)
# ===================================================================


class TestChangePassword:
    def test_success(self, session):
        user = make_user(session, username="changer", email="ch@x.com", password="Old1234!", is_temp_pass=True)
        change_password(session, user, "Old1234!", "New1234!")
        assert verify_password("New1234!", user.hashed_password)
        assert user.is_temp_pass is False

    def test_wrong_current_password(self, session):
        user = make_user(session, username="changer2", email="ch2@x.com", password="Old1234!")
        with pytest.raises(HTTPException) as exc_info:
            change_password(session, user, "Wrong1234!", "New1234!")
        assert exc_info.value.status_code == 401

    def test_same_password_rejected(self, session):
        user = make_user(session, username="changer3", email="ch3@x.com", password="Same1234!")
        with pytest.raises(HTTPException) as exc_info:
            change_password(session, user, "Same1234!", "Same1234!")
        assert exc_info.value.status_code == 400


# ===================================================================
# regenerate_temporary_password (requires DB)
# ===================================================================


class TestRegenerateTemporaryPassword:
    def test_success(self, session):
        user = make_user(session, username="regen", email="regen@x.com", is_temp_pass=True)
        updated_user, new_pass = regenerate_temporary_password(session, user.id)
        assert verify_password(new_pass, updated_user.hashed_password)

    def test_non_temp_user_rejected(self, session):
        user = make_user(session, username="nontmp", email="nontmp@x.com", is_temp_pass=False)
        with pytest.raises(HTTPException) as exc_info:
            regenerate_temporary_password(session, user.id)
        assert exc_info.value.status_code == 400

    def test_nonexistent_user(self, session):
        with pytest.raises(HTTPException) as exc_info:
            regenerate_temporary_password(session, 9999)
        assert exc_info.value.status_code == 404
