import pytest
from unittest.mock import MagicMock
from typing import Generator

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session

import src.runs.active.router as running_router
from src.runs.active.dependencies import get_testing_engine
from src.runs.router import router as runs_router
from src.auth.models import Role as UserRole, User
from src.auth.dependencies import require_active_user, require_non_temporary_password
from src.database import get_session


BASE = "/api/v1/projects/1/runs/active"


def _auth_user() -> User:
	return User(
		id=1,
		first_name="Router",
		last_name="Tester",
		username="router_active_user",
		email="router_active_user@example.com",
		hashed_password="hashed",
		role=UserRole.ADMIN,
		is_active=True,
	)


@pytest.fixture()
def client(session: Session) -> Generator[TestClient, None, None]:
	app = FastAPI()
	app.include_router(runs_router, prefix="/api/v1")

	def _override_get_session() -> Generator[Session, None, None]:
		yield session

	app.dependency_overrides[get_session] = _override_get_session
	app.dependency_overrides[get_testing_engine] = lambda: MagicMock()

	with TestClient(app) as c:
		yield c

	app.dependency_overrides.clear()


# POST /new — start_run


def test_start_run_route_returns_active_run(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	async def mock_start_run(*args, **kwargs):
		return {
			"run_id": "abc-123",
			"indices": [0, 1],
			"name": "My Suite",
			"description": "Test suite",
			"mode": "NATURAL",
			"started_at": "2024-01-01T12:00:00",
			"finished_at": None,
			"status": "RUNNING",
		}

	monkeypatch.setattr(running_router.service, "start_run", mock_start_run)

	response = client.post(f"{BASE}/new?testsuite_id=1&mode=NATURAL")
	print(response.text)

	assert response.status_code == 200
	body = response.json()
	assert body["run_id"] == "abc-123"
	assert body["status"] == "RUNNING"
	assert body["name"] == "My Suite"
	assert body["mode"] == "NATURAL"
	assert body["indices"] == [0, 1]
	assert body["finished_at"] is None


def test_start_run_route_rejects_missing_query_params(client, override_current_user):
	override_current_user(_auth_user())

	response = client.post(f"{BASE}/new")

	assert response.status_code == 422


def test_start_run_route_rejects_invalid_mode(client, override_current_user):
	override_current_user(_auth_user())

	response = client.post(f"{BASE}/new?testsuite_id=1&mode=invalid_mode")

	assert response.status_code == 422


# GET /{run_id}/status


def test_get_run_status_route_returns_shape(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		running_router.service,
		"get_run_status",
		lambda *args, **kwargs: {
			"run_id": "abc-123",
			"indices": [0],
			"name": "Suite",
			"description": "Desc",
			"mode": "EXECUTABLE",
			"started_at": "2024-01-01T12:00:00",
			"finished_at": None,
			"status": "RUNNING",
		},
	)

	response = client.get(f"{BASE}/abc-123/status")

	assert response.status_code == 200
	body = response.json()
	assert body["run_id"] == "abc-123"
	assert body["status"] == "RUNNING"


# GET /{run_id}/testcases/{index}/status


def test_get_testcase_status_route_returns_shape(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		running_router.service,
		"get_testcase_status",
		lambda *args, **kwargs: {
			"index": 0,
			"name": "Login Test",
			"description": "Test login",
			"instruction": "Click login",
			"started_at": "2024-01-01T12:00:00",
			"finished_at": None,
			"status": "RUNNING",
		},
	)

	response = client.get(f"{BASE}/abc-123/testcases/0/status")

	assert response.status_code == 200
	body = response.json()
	assert body["index"] == 0
	assert body["name"] == "Login Test"
	assert body["status"] == "RUNNING"


def test_get_testcase_status_route_rejects_invalid_index(client, override_current_user):
	override_current_user(_auth_user())

	response = client.get(f"{BASE}/abc-123/testcases/not-an-int/status")

	assert response.status_code == 422


# GET /{run_id}/testcases/{index}/steps


def test_get_steps_route_returns_list(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		running_router.service,
		"get_testcase_steps",
		lambda *args, **kwargs: [
			{
				"index": 0,
				"executable": {"action": "click"},
				"screenshot_before": "b64before",
				"screenshot_after": "b64after",
				"started_at": "2024-01-01T12:00:01",
				"finished_at": "2024-01-01T12:00:02",
				"status": "PASSED",
			},
		],
	)

	response = client.get(f"{BASE}/abc-123/testcases/0/steps")

	assert response.status_code == 200
	body = response.json()
	assert isinstance(body, list)
	assert len(body) == 1
	assert body[0]["index"] == 0
	assert body[0]["status"] == "PASSED"


def test_get_steps_route_rejects_invalid_index(client, override_current_user):
	override_current_user(_auth_user())

	response = client.get(f"{BASE}/abc-123/testcases/not-an-int/steps")

	assert response.status_code == 422


# DELETE /{run_id} — abort_run


def test_abort_run_route_succeeds(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(running_router.service, "abort_run", lambda *args, **kwargs: None)

	response = client.delete(f"{BASE}/abc-123")

	assert response.status_code == 200


# WebSocket /{run_id}/testcases/{index}/progress


def test_ws_testcase_progress_streams_steps(client, monkeypatch):
	mock_ctx = MagicMock()
	monkeypatch.setattr(running_router.service, "_get_context", lambda run_id: mock_ctx)

	mock_step = MagicMock()
	mock_step.model_dump_json.return_value = '{"index": 0, "status": "passed"}'

	async def mock_stream(ctx, index):
		yield mock_step

	monkeypatch.setattr(running_router.service, "stream_testcase_progress_raw", mock_stream)

	with client.websocket_connect(f"{BASE}/test-run/testcases/0/progress") as ws:
		data = ws.receive_text()
		assert '"index": 0' in data

		done = ws.receive_json()
		assert done["event"] == "done"


def test_ws_testcase_progress_handles_missing_run(client, monkeypatch):
	def mock_get_context(run_id):
		raise HTTPException(status_code=404, detail="Run not found")

	monkeypatch.setattr(running_router.service, "_get_context", mock_get_context)

	with client.websocket_connect(f"{BASE}/nonexistent/testcases/0/progress") as ws:
		data = ws.receive_json()
		assert data["event"] == "error"
		assert "not found" in data["detail"].lower()


def test_ws_testcase_progress_handles_bad_index(client, monkeypatch):
	mock_ctx = MagicMock()
	monkeypatch.setattr(running_router.service, "_get_context", lambda run_id: mock_ctx)

	async def mock_stream(ctx, index):
		raise KeyError("bad index")
		yield  # noqa: unreachable

	monkeypatch.setattr(running_router.service, "stream_testcase_progress_raw", mock_stream)

	with client.websocket_connect(f"{BASE}/test-run/testcases/99/progress") as ws:
		data = ws.receive_json()
		assert data["event"] == "error"


# WebSocket /{run_id}/progress


def test_ws_all_progress_streams_steps(client, monkeypatch):
	mock_ctx = MagicMock()
	monkeypatch.setattr(running_router.service, "_get_context", lambda run_id: mock_ctx)

	mock_step = MagicMock()
	mock_step.model_dump_json.return_value = '{"index": 1, "status": "passed"}'

	async def mock_stream(ctx):
		yield mock_step

	monkeypatch.setattr(running_router.service, "stream_all_progress_raw", mock_stream)

	with client.websocket_connect(f"{BASE}/test-run/progress") as ws:
		data = ws.receive_text()
		assert '"index": 1' in data

		done = ws.receive_json()
		assert done["event"] == "done"


def test_ws_all_progress_handles_missing_run(client, monkeypatch):
	def mock_get_context(run_id):
		raise HTTPException(status_code=404, detail="Run not found")

	monkeypatch.setattr(running_router.service, "_get_context", mock_get_context)

	with client.websocket_connect(f"{BASE}/nonexistent/progress") as ws:
		data = ws.receive_json()
		assert data["event"] == "error"
		assert "not found" in data["detail"].lower()