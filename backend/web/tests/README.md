# Testing Conventions

## Structure

```
tests/
  conftest.py              # shared fixtures: session, client, factories
  auth/
    test_service.py        # unit tests for service-layer logic
    test_router.py         # integration tests for API routes
  projects/
    test_service.py
    test_router.py
  ...
```

**Mirror `src/` layout.** One `test_service.py` and one `test_router.py` per module.

## Test Types

| Type | Tests what | Uses DB? | Uses TestClient? | Speed |
|---|---|---|---|---|
| **Unit** (`test_service.py`) | Service functions, validators, pure logic | Some do | No | Fast |
| **Integration** (`test_router.py`) | HTTP routes, auth, full request cycle | Yes | Yes | Slower |

## Fixtures

All shared fixtures live in `tests/conftest.py`. Do NOT create nested `conftest.py` files unless you have a genuinely module-specific fixture that no other module will ever need.

### Core fixtures

- **`session`** — per-test DB session, rolled back after each test. Every test starts clean.
- **`client`** — FastAPI `TestClient` that uses the test `session` via dependency override.

### Factory functions (not fixtures)

Use `make_user(session, ...)` instead of a fixture. Factories are:
- **Explicit** — you see exactly what's being created at the call site.
- **Composable** — easy to create multiple users with different roles.
- **No magic** — no implicit fixture chains to trace.

```python
# Good: explicit, readable
def test_admin_deletes_user(self, client, session):
    admin = make_user(session, username="admin", role=Role.ADMIN)
    target = make_user(session, username="target")
    resp = client.delete(f"/api/v1/users/{target.id}", headers=auth_header(admin.id))
    assert resp.status_code == 204
```

When adding a new module, add its factory to `conftest.py` (e.g., `make_project`, `make_testsuite`).

## Naming & Organization

- **Group by behavior** using classes: `class TestLogin:`, `class TestChangePassword:`.
- **Method names describe the scenario**: `test_wrong_password`, `test_non_admin_rejected`.
- **No `test_1`, `test_2`** — names must be meaningful.

## Auth in Integration Tests

Use the `auth_header(user_id)` helper to generate a valid Bearer token for any user:

```python
def auth_header(user_id: int) -> dict[str, str]:
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}
```

This avoids hitting the login endpoint in every test.

## Anti-Patterns to Avoid

1. **No mocking the database.** Use the real in-memory SQLite session. Mocking `session.exec()` couples tests to implementation, not behavior.
2. **No shared mutable state between tests.** The session fixture rolls back after each test. Never rely on data from a previous test.
3. **No testing framework internals.** Don't assert on SQLAlchemy queries or internal function calls. Assert on return values and HTTP responses.
4. **No fixture chains.** Keep the fixture graph shallow. If you need a user, call `make_user()` — don't create `user_fixture` → `admin_fixture` → `active_admin_fixture`.
5. **No `unittest.mock.patch` on DB queries.** If you need to test what happens when a query returns `None`, set up the DB state so it naturally returns `None`.
6. **No test-only code in production modules.** Tests adapt to the app, not the other way around.
