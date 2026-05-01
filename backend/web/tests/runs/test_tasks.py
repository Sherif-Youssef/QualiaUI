from datetime import datetime
from types import SimpleNamespace
import pytest

from src.runs import tasks
from src.runs.models import RunStatus, Scope


def test__build_testing_engine_uses_settings_and_headless(monkeypatch):
    created = {}

    class FakeTestingEngine:
        def __init__(self, model, config):
            created["model"] = model
            created["config"] = config

    monkeypatch.setattr(tasks, "TestingEngine", FakeTestingEngine)
    monkeypatch.setattr(tasks, "settings", SimpleNamespace(LLM_MODEL="fake-model"))

    engine = tasks._build_testing_engine()

    assert isinstance(engine, FakeTestingEngine)
    assert created["model"] == "fake-model"
    assert hasattr(created["config"], "browser")
    assert getattr(created["config"].browser, "headless") is True


def test_execute_testcase_task_run_builds_job_and_serializes_outcome(monkeypatch):
    fake_session = object()
    captured = {}

    class FakeOutcome:
        def model_dump(self, mode="json"):
            captured["dump_mode"] = mode
            return {"status": "PASSED"}

    class FakeJob:
        def __init__(self, testcase_run_id, *, engine, db_session, stream_key, abort_id, stream_steps):
            captured["job_args"] = {
                "testcase_run_id": testcase_run_id,
                "engine": engine,
                "db_session": db_session,
                "stream_key": stream_key,
                "abort_id": abort_id,
                "stream_steps": stream_steps,
            }

        async def execute_testcase(self):
            return FakeOutcome()

    class FakeSessionContext:
        def __enter__(self):
            return fake_session

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(tasks, "_build_testing_engine", lambda: "engine")
    monkeypatch.setattr(tasks, "TestCaseJob", FakeJob)
    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext())

    result = tasks.ExecuteTestcaseTask().run(7, "stream-7", 9, False)

    assert result == {"status": "PASSED"}
    assert captured["dump_mode"] == "json"
    assert captured["job_args"]["testcase_run_id"] == 7
    assert captured["job_args"]["engine"] == "engine"
    assert captured["job_args"]["db_session"] is fake_session
    assert captured["job_args"]["stream_key"] == "stream-7"
    assert captured["job_args"]["abort_id"] == 9
    assert captured["job_args"]["stream_steps"] is False


def test_execute_testcase_task_on_failure_returns_without_id(monkeypatch):
    calls = []

    def raise_if_called(*args, **kwargs):
        raise AssertionError("Session should not be called")

    monkeypatch.setattr(tasks, "Session", raise_if_called)
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.ExecuteTestcaseTask().on_failure(RuntimeError("boom"), "task-id", args=(), kwargs={}, einfo=None)

    assert calls == []


def test_execute_testcase_task_on_failure_skips_when_run_missing(monkeypatch):
    class FakeSession:
        def __init__(self):
            self.commit_calls = 0
            self.rollback_calls = 0

        def get(self, model, item_id):
            return None

        def add(self, item):
            raise AssertionError("Should not add when run missing")

        def commit(self):
            self.commit_calls += 1

        def rollback(self):
            self.rollback_calls += 1

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession()
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.ExecuteTestcaseTask().on_failure(RuntimeError("boom"), "task-id", args=(11, "stream-key"), kwargs={}, einfo=None)

    assert session.commit_calls == 0
    assert session.rollback_calls == 0
    assert calls == []


def test_execute_testcase_task_on_failure_rolls_back_on_commit_error(monkeypatch):
    run = SimpleNamespace(status=None, finished_at=None, termination_reason=None)

    class FakeSession:
        def __init__(self):
            self.rollback_calls = 0

        def get(self, model, item_id):
            return run

        def add(self, item):
            pass

        def commit(self):
            raise RuntimeError("commit failed")

        def rollback(self):
            self.rollback_calls += 1

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession()
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    with pytest.raises(RuntimeError, match="commit failed"):
        tasks.ExecuteTestcaseTask().on_failure(RuntimeError("boom"), "task-id", args=(11, "stream-key"), kwargs={}, einfo=None)

    assert session.rollback_calls == 1
    assert calls == []
    assert run.status == RunStatus.ERROR
    assert run.termination_reason == "Unexpected Error"
    assert run.finished_at is not None


def test_execute_testcase_task_on_failure_uses_kwargs(monkeypatch):
    run = SimpleNamespace(status=None, finished_at=None, termination_reason=None)

    class FakeSession:
        def __init__(self):
            self.commit_calls = 0

        def get(self, model, item_id):
            return run

        def add(self, item):
            pass

        def commit(self):
            self.commit_calls += 1

        def rollback(self):
            raise AssertionError("Rollback should not be called")

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession()
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.ExecuteTestcaseTask().on_failure(
        RuntimeError("boom"),
        "task-id",
        args=(),
        kwargs={"testcase_run_id": 33, "stream_key": "stream-key"},
        einfo=None,
    )

    assert run.status == RunStatus.ERROR
    assert run.termination_reason == "Unexpected Error"
    assert run.finished_at is not None
    assert session.commit_calls == 1
    assert calls[0][0] == ("stream-key",)
    assert calls[0][1]["event"].element == Scope.TESTCASE
    assert calls[0][1]["event"].id == 33
    assert calls[0][1]["event"].status == RunStatus.ERROR


def test_finalize_testsuite_task_sets_latest_finished_at(monkeypatch):
    run = SimpleNamespace(testsuite_id=5, status=None, finished_at=None)

    class FakeSession:
        def __init__(self, get_result=None):
            self.get_result = get_result
            self.commit_calls = 0

        def get(self, model, item_id):
            return self.get_result

        def add(self, item):
            pass

        def commit(self):
            self.commit_calls += 1

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession(get_result=run)
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.finalize_testsuite_task(
        [
            {"testcase_run_id": 1, "testcase_id": 10, "status": "PASSED", "finished_at": "2026-04-30T12:00:00"},
            {"testcase_run_id": 2, "testcase_id": 11, "status": "FAILED", "finished_at": "2026-04-30T14:00:00"},
        ],
        99,
        "runs:testsuite:99",
    )

    assert run.status == RunStatus.FAILED
    assert run.finished_at == datetime(2026, 4, 30, 14, 0, 0)
    assert session.commit_calls == 1
    assert calls[0][0] == ("runs:testsuite:99",)
    assert calls[0][1]["event"].element == Scope.TESTSUITE
    assert calls[0][1]["event"].id == 5


def test_finalize_testsuite_task_defaults_finished_at_when_empty(monkeypatch):
    run = SimpleNamespace(testsuite_id=8, status=None, finished_at=None)

    class FakeSession:
        def __init__(self, get_result=None):
            self.get_result = get_result
            self.commit_calls = 0

        def get(self, model, item_id):
            return self.get_result

        def add(self, item):
            pass

        def commit(self):
            self.commit_calls += 1

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession(get_result=run)
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.finalize_testsuite_task([], 14, "runs:testsuite:14")

    assert run.status == RunStatus.PASSED
    assert isinstance(run.finished_at, datetime)
    assert session.commit_calls == 1
    assert calls[0][1]["event"].element == Scope.TESTSUITE
    assert calls[0][1]["event"].id == 8


def test_finalize_project_task_defaults_finished_at_when_empty(monkeypatch):
    run = SimpleNamespace(project_id=7, status=None, finished_at=None)

    class FakeSession:
        def __init__(self, get_result=None):
            self.get_result = get_result
            self.commit_calls = 0

        def get(self, model, item_id):
            return self.get_result

        def add(self, item):
            pass

        def commit(self):
            self.commit_calls += 1

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession(get_result=run)
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine, expire_on_commit=None: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.finalize_project_task([], 22, "runs:project:22")

    assert run.status == RunStatus.PASSED
    assert isinstance(run.finished_at, datetime)
    assert session.commit_calls == 1
    assert calls[0][1]["event"].element == Scope.PROJECT


def test_finalize_project_task_prioritizes_aborted_over_failed(monkeypatch):
    run = SimpleNamespace(project_id=9, status=None, finished_at=None)

    class FakeSession:
        def __init__(self, get_result=None):
            self.get_result = get_result
            self.commit_calls = 0

        def get(self, model, item_id):
            return self.get_result

        def add(self, item):
            pass

        def commit(self):
            self.commit_calls += 1

    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False

    session = FakeSession(get_result=run)
    calls = []
    monkeypatch.setattr(tasks, "Session", lambda db_engine, expire_on_commit=None: FakeSessionContext(session))
    monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

    tasks.finalize_project_task(
        [
            {"testsuite_run_id": 1, "testsuite_id": 10, "status": "FAILED", "finished_at": "2026-04-30T12:00:00"},
            {"testsuite_run_id": 2, "testsuite_id": 11, "status": "ABORTED", "finished_at": "2026-04-30T15:00:00"},
        ],
        44,
        "runs:project:44",
    )

    assert run.status == RunStatus.ABORTED
    assert run.finished_at == datetime(2026, 4, 30, 15, 0, 0)
    assert session.commit_calls == 1
    assert calls[0][1]["event"].element == Scope.PROJECT
    assert calls[0][1]["event"].id == 9


def test_finalize_testsuite_task_raises_when_missing(monkeypatch):
    class FakeSession:
        def __init__(self, get_result=None):
            self.get_result = get_result

        def get(self, model, item_id):
            return None


    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False


    monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(FakeSession()))

    with pytest.raises(ValueError, match="TestSuiteRun 99 not found"):
        tasks.finalize_testsuite_task([], 99, "stream")


def test_finalize_project_task_raises_when_missing(monkeypatch):
    class FakeSession:
        def __init__(self, get_result=None):
            self.get_result = get_result

        def get(self, model, item_id):
            return None


    class FakeSessionContext:
        def __init__(self, session):
            self.session = session

        def __enter__(self):
            return self.session

        def __exit__(self, exc_type, exc, tb):
            return False


    monkeypatch.setattr(tasks, "Session", lambda db_engine, expire_on_commit=None: FakeSessionContext(FakeSession()))

    with pytest.raises(ValueError, match="ProjectRun 77 not found"):
        tasks.finalize_project_task([], 77, "stream")
