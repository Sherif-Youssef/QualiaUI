import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import timedelta

from src.auth.service import create_token
from src.auth.schemas import TokenType
from src.projects.models import Role as ProjectRole
from src.runs.models import RunMode, Scope

from tests.conftest import (
    make_user, make_project, make_testsuite, make_testcase,
    make_provider, make_llm_model, make_testsuite_run, make_testcase_run
)


def auth_header(user_id: int) -> dict[str, str]:
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}


class TestStartRunRoutes:
    @patch("src.runs.stream.get_redis_client")
    @patch("src.runs.service.app.send_task")
    def test_start_testcase_run_editor(self, mock_send_task, mock_get_redis, client: TestClient, session):
        mock_redis = MagicMock()
        mock_get_redis.return_value = mock_redis
        
        user = make_user(session, username="r_ed", email="r_ed@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        
        provider = make_provider(session, api_key="sk-test")
        llm = make_llm_model(session, provider)
        
        resp = client.post(
            "/api/v1/runs/testcases",
            headers=auth_header(user.id),
            json={
                "mode": RunMode.EXECUTABLE.value,
                "testcase_id": tc.id,
                "llm_model_id": llm.id
            }
        )
        assert resp.status_code == 200
        assert resp.json()["scope"] == Scope.TESTCASE.value

    @patch("src.runs.stream.get_redis_client")
    @patch("src.runs.service._build_testsuite_workflow_signature")
    def test_start_testsuite_run_viewer_rejected(self, mock_wf, mock_redis, client: TestClient, session):
        user = make_user(session, username="r_vi", email="r_vi@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project)
        make_testcase(session, ts)
        
        provider = make_provider(session, api_key="sk-test")
        llm = make_llm_model(session, provider)
        
        resp = client.post(
            "/api/v1/runs/testsuites",
            headers=auth_header(user.id),
            json={
                "mode": RunMode.EXECUTABLE.value,
                "testsuite_id": ts.id,
                "llm_model_id": llm.id
            }
        )
        assert resp.status_code == 403


class TestGetRunRoutes:
    def test_get_testcase_run_viewer(self, client: TestClient, session):
        user = make_user(session, username="r_get_vi", email="r_get_vi@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.VIEWER)])
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        tc_run = make_testcase_run(session, tc, user=user)
        
        resp = client.get(
            f"/api/v1/runs/testcases/{tc_run.id}",
            headers=auth_header(user.id)
        )
        assert resp.status_code == 200
        assert resp.json()["id"] == tc_run.id

    def test_get_testcase_run_outsider_rejected(self, client: TestClient, session):
        outsider = make_user(session, username="r_out", email="r_out@x.com")
        project = make_project(session, name="P")
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        tc_run = make_testcase_run(session, tc)
        
        resp = client.get(
            f"/api/v1/runs/testcases/{tc_run.id}",
            headers=auth_header(outsider.id)
        )
        assert resp.status_code == 403


class TestAbortRunRoutes:
    @patch("src.runs.service.abort_async")
    def test_abort_testcase_run_editor(self, mock_abort, client: TestClient, session):
        user = make_user(session, username="r_ab_ed", email="r_ab_ed@x.com")
        project = make_project(session, name="P", members=[(user, ProjectRole.EDITOR)])
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        tc_run = make_testcase_run(session, tc, user=user)
        tc_run.scope = Scope.TESTCASE
        session.add(tc_run)
        session.flush()
        
        resp = client.post(
            f"/api/v1/runs/testcases/{tc_run.id}/abort",
            headers=auth_header(user.id)
        )
        assert resp.status_code == 200
        assert mock_abort.called
