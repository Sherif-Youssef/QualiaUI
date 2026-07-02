import pytest
from unittest.mock import patch, MagicMock

from fastapi import HTTPException

from src.runs.models import RunMode, Scope
from src.runs.schemas import TestcaseStartRunRequest, TestsuiteStartRunRequest
from src.runs.service import launch_testcase_run, launch_testsuite_run, abort_testcase_run, abort_testsuite_run
from src.runs.queries import get_testcase_run_by_id_with_user_link, get_testsuite_run_by_id_with_user_link

from tests.conftest import make_project, make_testsuite, make_testcase, make_provider, make_llm_model, make_user, make_testcase_run, make_testsuite_run


class TestLaunchTestCaseRun:
    @patch("src.runs.stream.get_redis_client")
    @patch("src.runs.service.app.send_task")
    def test_launch_success(self, mock_send_task, mock_get_redis, session):
        # Setup mocks
        mock_redis = MagicMock()
        mock_get_redis.return_value = mock_redis
        
        # Setup data
        user = make_user(session)
        project = make_project(session)
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        provider = make_provider(session, api_key="sk-test")
        llm = make_llm_model(session, provider)
        
        req = TestcaseStartRunRequest(
            mode=RunMode.EXECUTABLE,
            testcase_id=tc.id,
            llm_model_id=llm.id,
        )
        
        resp = launch_testcase_run(session, tc, req, user)
        
        assert resp.scope == Scope.TESTCASE.value
        assert resp.run_id is not None
        
        # Verify db state
        tc_run, _ = get_testcase_run_by_id_with_user_link(session, resp.run_id, user.id)
        assert tc_run is not None
        assert tc_run.testcase_id == tc.id
        assert tc_run.llm_model_id == llm.id
        
        # Verify external calls
        assert mock_redis.delete.called
        assert mock_send_task.called
        
    def test_missing_api_key_raises(self, session):
        user = make_user(session)
        project = make_project(session)
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        
        # Provider without api_key
        provider = make_provider(session, api_key=None)
        llm = make_llm_model(session, provider)
        
        req = TestcaseStartRunRequest(
            mode=RunMode.EXECUTABLE,
            testcase_id=tc.id,
            llm_model_id=llm.id,
        )
        
        with pytest.raises(HTTPException) as exc_info:
            launch_testcase_run(session, tc, req, user)
        
        assert exc_info.value.status_code == 400
        assert "API Key" in exc_info.value.detail


class TestLaunchTestSuiteRun:
    @patch("src.runs.stream.get_redis_client")
    @patch("src.runs.service._build_testsuite_workflow_signature")
    def test_launch_success(self, mock_build_wf, mock_get_redis, session):
        # Setup mocks
        mock_redis = MagicMock()
        mock_get_redis.return_value = mock_redis
        mock_workflow = MagicMock()
        mock_build_wf.return_value = mock_workflow
        
        # Setup data
        user = make_user(session)
        project = make_project(session)
        ts = make_testsuite(session, project)
        make_testcase(session, ts, name="TC1")
        make_testcase(session, ts, name="TC2")
        
        provider = make_provider(session, api_key="sk-test")
        llm = make_llm_model(session, provider)
        
        req = TestsuiteStartRunRequest(
            mode=RunMode.EXECUTABLE,
            testsuite_id=ts.id,
            llm_model_id=llm.id,
        )
        
        resp = launch_testsuite_run(session, ts, req, user)
        
        assert resp.scope == Scope.TESTSUITE.value
        assert resp.run_id is not None
        
        ts_run, _ = get_testsuite_run_by_id_with_user_link(session, resp.run_id, user.id)
        assert ts_run is not None
        assert ts_run.testsuite_id == ts.id
        assert len(ts_run.testcase_runs) == 2
        
        assert mock_redis.delete.called
        assert mock_workflow.apply_async.called

    def test_empty_testsuite_raises(self, session):
        user = make_user(session)
        project = make_project(session)
        ts = make_testsuite(session, project) # No testcases
        
        provider = make_provider(session, api_key="sk-test")
        llm = make_llm_model(session, provider)
        
        req = TestsuiteStartRunRequest(
            mode=RunMode.EXECUTABLE,
            testsuite_id=ts.id,
            llm_model_id=llm.id,
        )
        
        with pytest.raises(HTTPException) as exc_info:
            launch_testsuite_run(session, ts, req, user)
            
        assert exc_info.value.status_code == 400


class TestAbortRuns:
    @pytest.mark.asyncio
    @patch("src.runs.service.abort_async")
    async def test_abort_testcase_run(self, mock_abort, session):
        project = make_project(session)
        ts = make_testsuite(session, project)
        tc = make_testcase(session, ts)
        tc_run = make_testcase_run(session, tc)
        tc_run.scope = Scope.TESTCASE
        
        await abort_testcase_run(tc_run)
        mock_abort.assert_called_once_with(tc_run.id)

    @pytest.mark.asyncio
    @patch("src.runs.service.abort_async")
    async def test_abort_testsuite_run(self, mock_abort, session):
        project = make_project(session)
        ts = make_testsuite(session, project)
        ts_run = make_testsuite_run(session, ts)
        ts_run.scope = Scope.TESTSUITE
        
        await abort_testsuite_run(ts_run)
        mock_abort.assert_called_once_with(ts_run.id)
