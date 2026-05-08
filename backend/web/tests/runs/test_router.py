import pytest
from fastapi.testclient import TestClient
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from src.base.schemas import Scope
from src.runs.router import router
from src.runs.models import ProjectRun, RunMode, RunStatus, TestCaseRun, TestCaseStepRunStatus, TestStepRun, TestSuiteRun
from src.runs.router import get_project_run_route, get_testcase_run_route, get_testsuite_run_route

client = TestClient(router)

@pytest.mark.asyncio
async def test_stream_testcase_run_events(monkeypatch):
    called = []
    
    async def fake_sse_read_stream(stream_key, last_event_id, is_disconnected, stop_predicate):
        called.append((stream_key, last_event_id))
        yield b"data: test\n\n"
        
    monkeypatch.setattr("src.runs.router.sse_read_stream", fake_sse_read_stream)
    monkeypatch.setattr("src.runs.router.get_stream_key", lambda scope, uid: f"key-{uid}")
    monkeypatch.setattr("src.runs.router.stop_predicate_factory", lambda scope: lambda x: False)
    
    from src.runs.router import stream_testcase_run_events
    
    class FakeRequest:
        async def is_disconnected(self):
            return False

    req = FakeRequest()
    run = SimpleNamespace(scope=Scope.TESTCASE, id=1)
    
    resp = stream_testcase_run_events(request=req, testcase_run=run, last_event_id="0-0")
    gen = resp.body_iterator
    
    items = []
    async for i in gen:
        items.append(i)
    assert called[0] == ("key-1", "0-0")


@pytest.mark.asyncio
async def test_stream_testsuite_run_events(monkeypatch):
    called = []
    async def fake_sse_read_stream(stream_key, last_event_id, is_disconnected, stop_predicate):
        called.append((stream_key, last_event_id))
        yield b"data: test\n\n"
    monkeypatch.setattr("src.runs.router.sse_read_stream", fake_sse_read_stream)
    monkeypatch.setattr("src.runs.router.get_stream_key", lambda scope, uid: f"key-{uid}")
    monkeypatch.setattr("src.runs.router.stop_predicate_factory", lambda scope: lambda x: False)
    
    from src.runs.router import stream_testsuite_run_events
    run = SimpleNamespace(scope=Scope.TESTSUITE, id=2)
    resp = stream_testsuite_run_events(request=SimpleNamespace(is_disconnected=lambda: False), testsuite_run=run, last_event_id="1-0")
    items = []
    async for i in resp.body_iterator:
        items.append(i)
    assert called[0] == ("key-2", "1-0")


@pytest.mark.asyncio
async def test_stream_project_run_events(monkeypatch):
    called = []
    async def fake_sse_read_stream(stream_key, last_event_id, is_disconnected, stop_predicate):
        called.append((stream_key, last_event_id))
        yield b"data: test\n\n"
    monkeypatch.setattr("src.runs.router.sse_read_stream", fake_sse_read_stream)
    monkeypatch.setattr("src.runs.router.get_stream_key", lambda scope, uid: f"key-{uid}")
    monkeypatch.setattr("src.runs.router.stop_predicate_factory", lambda scope: lambda x: False)
    
    from src.runs.router import stream_project_run_events
    run = SimpleNamespace(scope=Scope.PROJECT, id=3)
    resp = stream_project_run_events(request=SimpleNamespace(is_disconnected=lambda: False), project_run=run, last_event_id="2-0")
    items = []
    async for i in resp.body_iterator:
        items.append(i)
    assert called[0] == ("key-3", "2-0")


def test_get_testcase_run_route_includes_steps():
    step = TestStepRun(
        id=1,
        testcase_run_id=11,
        status=TestCaseStepRunStatus.PASSED,
    )
    run = TestCaseRun(
        id=11,
        scope=Scope.TESTCASE,
        mode=RunMode.NATURAL,
        status=RunStatus.RUNNING,
        job_uid="job-11",
        testcase_id=21,
        name="Test Login",
        base_url="https://example.test",
        instruction="Open the login page",
        testsuite_run_id=None,
    )
    run.teststep_runs = [step]

    result = get_testcase_run_route(testcase_run=run)

    assert len(result.teststep_runs) == 1
    assert result.teststep_runs[0].status == TestCaseStepRunStatus.PASSED


def test_get_testsuite_run_route_excludes_teststep_runs():
    step = TestStepRun(
        id=2,
        testcase_run_id=12,
        status=TestCaseStepRunStatus.FAILED,
    )
    testcase_run = TestCaseRun(
        id=12,
        scope=Scope.TESTSUITE,
        mode=RunMode.NATURAL,
        status=RunStatus.FAILED,
        job_uid="job-12",
        testcase_id=22,
        name="Test Login",
        base_url="https://example.test",
        instruction="Open the login page",
        testsuite_run_id=31,
    )
    testcase_run.teststep_runs = [step]

    testsuite_run = TestSuiteRun(
        id=31,
        scope=Scope.TESTSUITE,
        mode=RunMode.NATURAL,
        status=RunStatus.RUNNING,
        job_uid="job-suite",
        testsuite_id=41,
        project_run_id=None,
    )
    testsuite_run.testcase_runs = [testcase_run]

    result = get_testsuite_run_route(testsuite_run=testsuite_run)

    assert len(result.testcase_runs) == 1
    assert "teststep_runs" not in result.testcase_runs[0].model_dump()


def test_get_project_run_route_excludes_testcase_runs():
    testcase_run = TestCaseRun(
        id=13,
        scope=Scope.PROJECT,
        mode=RunMode.NATURAL,
        status=RunStatus.PASSED,
        job_uid="job-13",
        testcase_id=23,
        name="Test Login",
        base_url="https://example.test",
        instruction="Open the login page",
        testsuite_run_id=32,
    )
    testsuite_run = TestSuiteRun(
        id=32,
        scope=Scope.PROJECT,
        mode=RunMode.NATURAL,
        status=RunStatus.PASSED,
        job_uid="job-suite-2",
        testsuite_id=42,
        project_run_id=52,
    )
    testsuite_run.testcase_runs = [testcase_run]

    project_run = ProjectRun(
        id=52,
        scope=Scope.PROJECT,
        mode=RunMode.NATURAL,
        status=RunStatus.RUNNING,
        job_uid="job-project",
        project_id=62,
    )
    project_run.testsuite_runs = [testsuite_run]

    result = get_project_run_route(project_run=project_run)

    assert len(result.testsuite_runs) == 1
    assert "testcase_runs" not in result.testsuite_runs[0].model_dump()

