import src.testcases.router as testcases_router
from src.auth.models import Role as UserRole, User


def _auth_user() -> User:
	return User(
		id=1,
		first_name="Router",
		last_name="Tester",
		username="router_testcase_user",
		email="router_testcase_user@example.com",
		hashed_password="hashed",
		role=UserRole.ADMIN,
		is_active=True,
	)


def test_list_testcases_route_returns_paginated_shape(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		testcases_router,
		"list_testcases",
		lambda *args, **kwargs: {
			"total_items": 1,
			"items": [
				{
					"id": 10,
					"testsuite_id": 2,
					"name": "Login Test",
					"description": "Test login flow",
					"base_url": "https://example.com",
					"instruction": "Click login",
					"executable_steps": None,
				}
			],
			"offset": 0,
			"limit": 25,
		},
	)

	response = client.get("/api/v1/projects/1/testsuites/2/testcases")

	assert response.status_code == 200
	body = response.json()
	assert set(body.keys()) == {"total_items", "items", "offset", "limit"}
	assert isinstance(body["items"], list)
	assert body["items"][0]["id"] == 10
	assert body["items"][0]["name"] == "Login Test"


def test_get_testcase_route_rejects_invalid_id(client, override_current_user):
	override_current_user(_auth_user())

	response = client.get("/api/v1/projects/1/testsuites/2/testcases/not-an-int")

	assert response.status_code == 422


def test_get_testcase_route_returns_testcase_shape(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		testcases_router,
		"get_testcase",
		lambda *args, **kwargs: {
			"id": 7,
			"testsuite_id": 1,
			"name": "Homepage Test",
			"description": "Smoke test",
			"base_url": "https://example.com",
			"instruction": "Load homepage",
			"executable_steps": None,
		},
	)

	response = client.get("/api/v1/projects/1/testsuites/1/testcases/7")

	assert response.status_code == 200
	body = response.json()
	assert body["id"] == 7
	assert body["testsuite_id"] == 1
	assert body["name"] == "Homepage Test"


def test_create_testcase_route_rejects_invalid_body(client, override_current_user):
	override_current_user(_auth_user())

	response = client.post(
		"/api/v1/projects/1/testsuites/2/testcases",
		json={"description": "Missing required fields"},
	)

	assert response.status_code == 422


def test_create_testcase_route_returns_created_testcase(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		testcases_router,
		"create_testcase",
		lambda *args, **kwargs: {
			"id": 9,
			"testsuite_id": 1,
			"name": "Created Test",
			"description": "Created via router",
			"base_url": "https://example.com",
			"instruction": "Perform action",
			"executable_steps": None,
		},
	)

	response = client.post(
		"/api/v1/projects/1/testsuites/1/testcases",
		json={
			"name": "Created Test",
			"description": "Created via router",
			"base_url": "https://example.com",
			"instruction": "Perform action",
		},
	)

	assert response.status_code == 201
	body = response.json()
	assert body["id"] == 9
	assert body["name"] == "Created Test"
	assert body["testsuite_id"] == 1


def test_update_testcase_route_returns_updated_testcase(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(
		testcases_router,
		"update_testcase",
		lambda *args, **kwargs: {
			"id": 11,
			"testsuite_id": 1,
			"name": "Updated Test",
			"description": "Updated",
			"base_url": "https://updated.com",
			"instruction": "New instruction",
			"executable_steps": None,
		},
	)

	response = client.put(
		"/api/v1/projects/1/testsuites/1/testcases/11",
		json={
			"name": "Updated Test",
			"description": "Updated",
			"base_url": "https://updated.com",
			"instruction": "New instruction",
		},
	)

	assert response.status_code == 200
	body = response.json()
	assert body["id"] == 11
	assert body["name"] == "Updated Test"


def test_delete_testcase_route_returns_204(client, monkeypatch, override_current_user):
	override_current_user(_auth_user())

	monkeypatch.setattr(testcases_router, "delete_testcase", lambda *args, **kwargs: None)

	response = client.delete("/api/v1/projects/1/testsuites/1/testcases/3")

	assert response.status_code == 204
	assert response.text == ""
