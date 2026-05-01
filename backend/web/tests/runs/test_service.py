from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from src.base.schemas import Scope
from src.projects.models import Project
from src.runs import router as runs_router
from src.runs import service
from src.runs.models import RunMode, RunStatus, TestCaseRun as RunTestCaseRun, TestSuiteRun as RunTestSuiteRun
from src.runs.schemas import (
    ProjectStartRunRequest,
    StartRunResponse,
    TestcaseStartRunRequest as CaseRunRequest,
    TestsuiteStartRunRequest as SuiteRunRequest,
)
from src.testcases.models import TestCase as CaseModel
from src.testsuites.models import TestSuite as SuiteModel


class FakeSession:
    def __init__(self):
        self.added = []
        self.flush_calls = 0
        self.commit_calls = 0
        self._next_id = 1

    def add(self, item):
        self.added.append(item)

    def add_all(self, items):
        self.added.extend(list(items))

    def flush(self):
        self.flush_calls += 1
        for item in self.added:
            if getattr(item, "id", None) is None:
                item.id = self._next_id
                self._next_id += 1

    def commit(self):
        self.commit_calls += 1


def _uuid_sequence(*values):
    iterator = iter(values)

    def _next_uuid():
        return next(iterator)

    return _next_uuid


def _make_testcase(*, testcase_id: int = 11, testsuite_id: int = 7) -> CaseModel:
    testcase = CaseModel(
        id=testcase_id,
        testsuite_id=testsuite_id,
        name="Login flow",
        description="",
        base_url="https://example.test",
        instruction="Open the login page",
    )
    return testcase


def _make_testsuite(*, testsuite_id: int = 7, project_id: int = 3, testcases=None) -> SuiteModel:
    testsuite = SuiteModel(
        id=testsuite_id,
        project_id=project_id,
        name="Core flows",
        description="",
    )
    testsuite.testcases = list(testcases or [])
    return testsuite


def _make_project(*, project_id: int = 3, testsuites=None) -> Project:
    project = Project(
        id=project_id,
        name="Qualia",
        description="",
    )
    project.testsuites = list(testsuites or [])
    return project


def test_launch_testcase_run_creates_run_and_enqueues_task(monkeypatch):
    session = FakeSession()
    testcase = _make_testcase()
    workflow_task = MagicMock()

    monkeypatch.setattr(service, "_generate_uuid", _uuid_sequence("job-1"))
    monkeypatch.setattr(service.app, "send_task", workflow_task)
    monkeypatch.setattr(service, "get_stream_key", lambda scope, run_id: f"stream:{scope}:{run_id}")

    result = service.launch_testcase_run(session=session, testcase=testcase, mode=RunMode.NATURAL)

    assert result == StartRunResponse(
        scope=Scope.TESTCASE.value,
        run_id=1,
        mode=RunMode.NATURAL,
        status=RunStatus.QUEUED,
        created_at=result.created_at,
    )
    assert session.flush_calls == 1
    assert session.commit_calls == 1
    workflow_task.assert_called_once_with(
        "runs.execute_testcase",
        kwargs={
            "testcase_run_id": 1,
            "stream_key": "stream:TESTCASE:1",
            "abort_id": 1,
            "stream_steps": True,
        },
        task_id="job-1",
    )


def test_launch_testsuite_run_creates_child_runs_and_schedules_workflow(monkeypatch):
    session = FakeSession()
    testcase_one = _make_testcase(testcase_id=11)
    testcase_two = _make_testcase(testcase_id=12)
    testsuite = _make_testsuite(testcases=[testcase_one, testcase_two])
    workflow = SimpleNamespace(apply_async=MagicMock())
    captured = {}

    monkeypatch.setattr(service, "_generate_uuid", _uuid_sequence("suite-job", "case-job-1", "case-job-2"))
    monkeypatch.setattr(service, "get_stream_key", lambda scope, run_id: f"stream:{scope}:{run_id}")

    def fake_build_testsuite_workflow_signature(**kwargs):
        captured.update(kwargs)
        return workflow

    monkeypatch.setattr(service, "_build_testsuite_workflow_signature", fake_build_testsuite_workflow_signature)

    result = service.launch_testsuite_run(session=session, testsuite=testsuite, mode=RunMode.EXECUTABLE)

    assert result.scope == Scope.TESTSUITE.value
    assert result.run_id == 1
    assert result.mode == RunMode.EXECUTABLE
    assert result.status == RunStatus.QUEUED
    assert session.flush_calls == 2
    assert session.commit_calls == 1
    assert captured == {
        "testcase_runs_ids": [2, 3],
        "testcase_job_uids": ["case-job-1", "case-job-2"],
        "testsuite_run_id": 1,
        "stream_key": "stream:TESTSUITE:1",
        "abort_id": 1,
        "stream_steps": False,
    }
    workflow.apply_async.assert_called_once_with(task_id="suite-job")


def test_launch_testsuite_run_rejects_empty_suite():
    session = FakeSession()
    testsuite = _make_testsuite(testcases=[])

    with pytest.raises(HTTPException, match="Test suite has no test cases"):
        service.launch_testsuite_run(session=session, testsuite=testsuite, mode=RunMode.NATURAL)

    assert session.flush_calls == 0
    assert session.commit_calls == 0


def test_launch_project_run_creates_nested_workflows(monkeypatch):
    session = FakeSession()
    suite_one = _make_testsuite(testsuite_id=21, testcases=[_make_testcase(testcase_id=31), _make_testcase(testcase_id=32)])
    suite_two = _make_testsuite(testsuite_id=22, testcases=[_make_testcase(testcase_id=33)])
    project = _make_project(testsuites=[suite_one, suite_two])
    project_workflow = SimpleNamespace(apply_async=MagicMock())
    suite_workflows = []
    captured = []

    monkeypatch.setattr(
        service,
        "_generate_uuid",
        _uuid_sequence("project-job", "suite-job-1", "case-job-1", "case-job-2", "suite-job-2", "case-job-3"),
    )
    monkeypatch.setattr(service, "get_stream_key", lambda scope, run_id: f"stream:{scope}:{run_id}")

    def fake_build_testsuite_workflow_signature(**kwargs):
        workflow = SimpleNamespace(apply_async=MagicMock())
        captured.append(kwargs)
        suite_workflows.append(workflow)
        return workflow

    def fake_build_project_workflow_signature(**kwargs):
        assert kwargs["testsuite_workflows"] == suite_workflows
        assert kwargs["project_run_id"] == 1
        assert kwargs["stream_key"] == "stream:PROJECT:1"
        return project_workflow

    monkeypatch.setattr(service, "_build_testsuite_workflow_signature", fake_build_testsuite_workflow_signature)
    monkeypatch.setattr(service, "_build_project_workflow_signature", fake_build_project_workflow_signature)

    result = service.launch_project_run(session=session, project=project, mode=RunMode.NATURAL)

    assert result.scope == Scope.PROJECT.value
    assert result.run_id == 1
    assert result.mode == RunMode.NATURAL
    assert result.status == RunStatus.RUNNING
    assert session.flush_calls == 3
    assert session.commit_calls == 1
    assert len(captured) == 2
    assert captured[0]["testcase_runs_ids"] == [4, 5]
    assert captured[0]["testcase_job_uids"] == ["case-job-1", "case-job-2"]
    assert captured[0]["testsuite_run_id"] == 2
    assert captured[0]["abort_id"] == 1
    assert captured[1]["testcase_runs_ids"] == [6]
    assert captured[1]["testcase_job_uids"] == ["case-job-3"]
    assert captured[1]["testsuite_run_id"] == 3
    assert captured[1]["abort_id"] == 1
    project_workflow.apply_async.assert_called_once_with(task_id="project-job")


def test_launch_project_run_rejects_project_without_testsuites():
    session = FakeSession()
    project = _make_project(testsuites=[])

    with pytest.raises(HTTPException, match="Project has no test suites"):
        service.launch_project_run(session=session, project=project, mode=RunMode.NATURAL)

    assert session.flush_calls == 0
    assert session.commit_calls == 0


def test_launch_project_run_rejects_project_without_executable_cases():
    session = FakeSession()
    empty_suite = _make_testsuite(testsuite_id=21, testcases=[])
    project = _make_project(testsuites=[empty_suite])

    with pytest.raises(HTTPException, match="Project has no executable test cases"):
        service.launch_project_run(session=session, project=project, mode=RunMode.NATURAL)

    assert session.flush_calls == 1
    assert session.commit_calls == 0


def test_launch_project_run_skips_empty_suites(monkeypatch):
    session = FakeSession()
    empty_suite = _make_testsuite(testsuite_id=21, testcases=[])
    suite = _make_testsuite(testsuite_id=22, testcases=[_make_testcase(testcase_id=31), _make_testcase(testcase_id=32)])
    project = _make_project(testsuites=[empty_suite, suite])
    project_workflow = SimpleNamespace(apply_async=MagicMock())
    captured = []

    monkeypatch.setattr(
        service,
        "_generate_uuid",
        _uuid_sequence("project-job", "suite-job-1", "case-job-1", "case-job-2"),
    )
    monkeypatch.setattr(service, "get_stream_key", lambda scope, run_id: f"stream:{scope}:{run_id}")

    def fake_build_testsuite_workflow_signature(**kwargs):
        captured.append(kwargs)
        return SimpleNamespace(apply_async=MagicMock())

    def fake_build_project_workflow_signature(**kwargs):
        return project_workflow

    monkeypatch.setattr(service, "_build_testsuite_workflow_signature", fake_build_testsuite_workflow_signature)
    monkeypatch.setattr(service, "_build_project_workflow_signature", fake_build_project_workflow_signature)

    result = service.launch_project_run(session=session, project=project, mode=RunMode.NATURAL)

    assert result.run_id == 1
    assert len(captured) == 1
    assert captured[0]["testcase_runs_ids"] == [3, 4]
    assert captured[0]["testsuite_run_id"] == 2
    assert captured[0]["abort_id"] == 1
    project_workflow.apply_async.assert_called_once_with(task_id="project-job")


@pytest.mark.asyncio
async def test_abort_testcase_run_calls_abort_async(monkeypatch):
    testcase_run = RunTestCaseRun(
        id=9,
        scope=Scope.TESTCASE,
        mode=RunMode.NATURAL,
        status=RunStatus.QUEUED,
        job_uid="job-9",
        testcase_id=11,
        base_url="https://example.test",
        instruction="Open the login page",
        testsuite_run_id=None,
    )
    abort_async = AsyncMock()
    monkeypatch.setattr(service, "abort_async", abort_async)

    await service.abort_testcase_run(testcase_run=testcase_run)

    abort_async.assert_awaited_once_with(9)


@pytest.mark.asyncio
async def test_abort_testcase_run_rejects_non_testcase_scope(monkeypatch):
    testcase_run = RunTestCaseRun(
        id=9,
        scope=Scope.TESTSUITE,
        mode=RunMode.NATURAL,
        status=RunStatus.QUEUED,
        job_uid="job-9",
        testcase_id=11,
        base_url="https://example.test",
        instruction="Open the login page",
        testsuite_run_id=3,
    )
    abort_async = AsyncMock()
    monkeypatch.setattr(service, "abort_async", abort_async)

    with pytest.raises(HTTPException, match="Only standalone testcase runs can be aborted directly"):
        await service.abort_testcase_run(testcase_run=testcase_run)

    abort_async.assert_not_called()


@pytest.mark.asyncio
async def test_abort_testsuite_run_calls_abort_async(monkeypatch):
    testsuite_run = RunTestSuiteRun(
        id=4,
        scope=Scope.TESTSUITE,
        mode=RunMode.EXECUTABLE,
        status=RunStatus.RUNNING,
        job_uid="job-4",
        testsuite_id=21,
    )
    abort_async = AsyncMock()
    monkeypatch.setattr(service, "abort_async", abort_async)

    await service.abort_testsuite_run(testsuite_run=testsuite_run)

    abort_async.assert_awaited_once_with(4)


@pytest.mark.asyncio
async def test_abort_testsuite_run_rejects_non_testsuite_scope(monkeypatch):
    testsuite_run = RunTestSuiteRun(
        id=4,
        scope=Scope.PROJECT,
        mode=RunMode.EXECUTABLE,
        status=RunStatus.RUNNING,
        job_uid="job-4",
        testsuite_id=21,
        project_run_id=1,
    )
    abort_async = AsyncMock()
    monkeypatch.setattr(service, "abort_async", abort_async)

    with pytest.raises(HTTPException, match="Only standalone testsuite runs can be aborted directly"):
        await service.abort_testsuite_run(testsuite_run=testsuite_run)

    abort_async.assert_not_called()


@pytest.mark.asyncio
async def test_abort_project_run_calls_abort_async(monkeypatch):
    project_run = SimpleNamespace(id=12)
    abort_async = AsyncMock()
    monkeypatch.setattr(service, "abort_async", abort_async)

    await service.abort_project_run(project_run=project_run)

    abort_async.assert_awaited_once_with(12)


def test_stop_predicate_factory_filters_status_events_by_scope():
    predicate = service.stop_predicate_factory(Scope.TESTCASE)

    assert predicate({}) is False
    assert predicate({"type": "OTHER"}) is False
    assert predicate({"type": "STATUS_CHANGE"}) is False
    assert predicate({"type": "STATUS_CHANGE", "event": {}}) is False
    assert predicate({"type": "STATUS_CHANGE", "event": {"element": "TESTSUITE", "status": "PASSED"}}) is False
    assert predicate({"type": "STATUS_CHANGE", "event": {"element": "TESTCASE", "status": "RUNNING"}}) is False
    assert predicate({"type": "STATUS_CHANGE", "event": {"element": "TESTCASE", "status": "PASSED"}}) is True
    assert predicate({"type": "STATUS_CHANGE", "event": {"element": "TESTCASE", "status": "FAILED"}}) is True
    assert predicate({"type": "STATUS_CHANGE", "event": {"element": "TESTCASE", "status": "ERROR"}}) is True
    assert predicate({"type": "STATUS_CHANGE", "event": {"element": "TESTCASE", "status": "ABORTED"}}) is True


@pytest.mark.asyncio
async def test_start_testcase_run_route_delegates_to_service(monkeypatch):
    session = object()
    user = object()
    payload = CaseRunRequest(mode=RunMode.NATURAL, testcase_id=101)
    testcase = _make_testcase(testcase_id=101)
    response = StartRunResponse(
        scope=Scope.TESTCASE.value,
        run_id=1,
        mode=RunMode.NATURAL,
        status=RunStatus.QUEUED,
        created_at=datetime.now(),
    )

    monkeypatch.setattr(runs_router, "get_editor_testcase", lambda **kwargs: testcase)
    monkeypatch.setattr(runs_router, "launch_testcase_run", lambda **kwargs: response)

    result = await runs_router.start_testcase_run_route(session=session, user=user, payload=payload)

    assert result is response


@pytest.mark.asyncio
async def test_start_testsuite_run_route_delegates_to_service(monkeypatch):
    session = object()
    user = object()
    payload = SuiteRunRequest(mode=RunMode.EXECUTABLE, testsuite_id=77)
    testsuite = _make_testsuite(testsuite_id=77, testcases=[_make_testcase(testcase_id=301)])
    response = StartRunResponse(
        scope=Scope.TESTSUITE.value,
        run_id=2,
        mode=RunMode.EXECUTABLE,
        status=RunStatus.QUEUED,
        created_at=datetime.now(),
    )

    monkeypatch.setattr(runs_router, "get_editor_testsuite", lambda **kwargs: testsuite)
    monkeypatch.setattr(runs_router, "launch_testsuite_run", lambda **kwargs: response)

    result = await runs_router.start_testsuite_run_route(session=session, user=user, payload=payload)

    assert result is response


@pytest.mark.asyncio
async def test_start_project_run_route_delegates_to_service(monkeypatch):
    session = object()
    user = object()
    payload = ProjectStartRunRequest(mode=RunMode.NATURAL, project_id=55)
    project = _make_project(project_id=55, testsuites=[_make_testsuite(testsuite_id=88, testcases=[_make_testcase(testcase_id=501)])])
    response = StartRunResponse(
        scope=Scope.PROJECT.value,
        run_id=3,
        mode=RunMode.NATURAL,
        status=RunStatus.RUNNING,
        created_at=datetime.now(),
    )

    monkeypatch.setattr(runs_router, "get_editor_project", lambda **kwargs: project)
    monkeypatch.setattr(runs_router, "launch_project_run", lambda **kwargs: response)

    result = await runs_router.start_project_run_route(session=session, user=user, payload=payload)

    assert result is response


@pytest.mark.asyncio
async def test_abort_testcase_run_route_delegates_to_service(monkeypatch):
    testcase_run = SimpleNamespace(id=1)
    calls = []

    async def fake_abort_testcase_run(*, testcase_run):
        calls.append(testcase_run)

    monkeypatch.setattr(runs_router, "abort_testcase_run", fake_abort_testcase_run)

    await runs_router.abort_testcase_run_route(testcase_run=testcase_run)

    assert calls == [testcase_run]


@pytest.mark.asyncio
async def test_abort_testsuite_run_route_delegates_to_service(monkeypatch):
    testsuite_run = SimpleNamespace(id=2)
    calls = []

    async def fake_abort_testsuite_run(*, testsuite_run):
        calls.append(testsuite_run)

    monkeypatch.setattr(runs_router, "abort_testsuite_run", fake_abort_testsuite_run)

    await runs_router.abort_testsuite_run_route(testsuite_run=testsuite_run)

    assert calls == [testsuite_run]


@pytest.mark.asyncio
async def test_abort_project_run_route_delegates_to_service(monkeypatch):
    project_run = SimpleNamespace(id=3)
    calls = []

    async def fake_abort_project_run(*, project_run):
        calls.append(project_run)

    monkeypatch.setattr(runs_router, "abort_project_run", fake_abort_project_run)

    await runs_router.abort_project_run_route(project_run=project_run)

    assert calls == [project_run]