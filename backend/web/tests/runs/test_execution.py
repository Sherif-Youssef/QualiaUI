from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock
import json

import pytest

from src.base.schemas import Scope
from src.projects.models import Role as ProjectRole
from src.runs import dependencies, execution, stream, tasks
from src.runs.models import (
	ProjectRun as ProjectRunModel,
	RunMode,
	RunStatus,
	TestCaseRun as CaseRunModel,
	TestCaseStepRunStatus,
	TestStepRun,
	TestSuiteRun as SuiteRunModel,
)


class FakeSession:
	def __init__(self, *, get_result=None):
		self.get_result = get_result
		self.added = []
		self.flush_calls = 0
		self.commit_calls = 0
		self.rollback_calls = 0

	def get(self, model, item_id): 
		return self.get_result

	def add(self, item):
		self.added.append(item)

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



class DummyStatus:
	def __init__(self, value):
		self.value = value



class FakeStepClass:
	pass



class FakeTerminationClass:
	pass



def make_case_run(*, status=RunStatus.RUNNING):
	return CaseRunModel(
		id=11,
		scope=Scope.TESTCASE,
		mode=RunMode.NATURAL,
		status=status,
		job_uid="job-11",
		testcase_id=21,
		base_url="https://example.test",
		instruction="Open the login page",
		testsuite_run_id=None,
	)


def make_suite_run(*, status=RunStatus.RUNNING):
	return SuiteRunModel(
		id=12,
		scope=Scope.TESTSUITE,
		mode=RunMode.EXECUTABLE,
		status=status,
		job_uid="job-12",
		testsuite_id=22,
	)


def make_project_run(*, status=RunStatus.RUNNING):
	return ProjectRunModel(
		id=13,
		scope=Scope.PROJECT,
		mode=RunMode.NATURAL,
		status=status,
		job_uid="job-13",
		project_id=23,
	)


def test_execution_status_mappers_follow_enum_values():
	assert execution.to_run_status(DummyStatus("PASSED")) == RunStatus.PASSED
	assert execution.to_run_status(DummyStatus("FAILED")) == RunStatus.FAILED
	assert execution.to_test_step_run_status(DummyStatus("ERROR")) == TestCaseStepRunStatus.ERROR


def test_aggregate_parent_status_prioritizes_aborted_then_failed():
	assert execution.aggregate_parent_status([RunStatus.PASSED, RunStatus.FAILED]) == RunStatus.FAILED
	assert execution.aggregate_parent_status([RunStatus.PASSED, RunStatus.ABORTED]) == RunStatus.ABORTED
	assert execution.aggregate_parent_status([RunStatus.PASSED, RunStatus.PASSED]) == RunStatus.PASSED


def test_testcase_outcome_payload_from_run():
	run = make_case_run(status=RunStatus.FAILED)
	run.finished_at = datetime(2026, 4, 30, 12, 0, 0)
	run.termination_reason = "explicit failure"

	payload = execution.TestCaseOutcomePayload.from_testcase_run(run)

	assert payload.testcase_run_id == 11
	assert payload.testcase_id == 21
	assert payload.status == RunStatus.FAILED
	assert payload.finished_at == datetime(2026, 4, 30, 12, 0, 0)
	assert payload.termination_reason == "explicit failure"


def test_stream_status_serializes_payload(monkeypatch):
	calls = []
	monkeypatch.setattr(execution, "stream_event", lambda *args, **kwargs: calls.append((args, kwargs)))

	execution.stream_status(
		"runs:testcase:11",
		event=execution.StatusChangeEvent(element=Scope.TESTCASE, id=21, status=RunStatus.RUNNING),
	)

	payload = json.loads(calls[0][1]["event"])
	assert calls[0][0] == ("runs:testcase:11",)
	assert calls[0][1]["event_type"] == execution.EventType.STATUS_CHANGE
	assert payload["element"] == "TESTCASE"
	assert payload["id"] == 21
	assert payload["status"] == "RUNNING"
	assert "time" in payload


def test_generate_uuid_returns_string(monkeypatch):
	monkeypatch.setattr(execution, "uuid4", lambda: "fixed-uuid")
	assert execution.generate_uuid() == "fixed-uuid"


@pytest.mark.asyncio
async def test_upload_screenshot_uses_generated_key_and_storage(monkeypatch):
	class FakeStorage:
		def __init__(self):
			self.calls = []

		async def upload_image(self, *, identifier, image):
			self.calls.append((identifier, image))
			return SimpleNamespace(url=f"https://cdn.example/{identifier.key}")

	fake_storage = FakeStorage()
	monkeypatch.setattr(execution, "get_s3_storage", lambda: fake_storage)
	monkeypatch.setattr(execution, "generate_uuid", lambda: "generated-key")
	monkeypatch.setattr(execution, "settings", SimpleNamespace(AWS_SCREENSHOTS_BUCKET="screenshots"))

	url = await execution.upload_screenshot(b"image-bytes")

	assert url == "https://cdn.example/generated-key"
	assert fake_storage.calls[0][0].bucket == "screenshots"
	assert fake_storage.calls[0][0].key == "generated-key"
	assert fake_storage.calls[0][1] == b"image-bytes"


@pytest.mark.asyncio
async def test_stream_step_uploads_snapshots_and_emits_step_event(monkeypatch):
 	class FakeStep(FakeStepClass):
 		def __init__(self):
 			self.snapshot_before = SimpleNamespace(screenshot=b"before")
 			self.snapshot_after = SimpleNamespace(screenshot=b"after")
 			self.id = 9

 		def model_dump(self, *, mode, exclude):
 			return {"id": self.id, "mode": mode, "exclude": sorted(exclude), "status": "PASSED"}

 	calls = []
 	monkeypatch.setattr(execution, "TestStep", FakeStep)
 	monkeypatch.setattr(execution, "TestTermination", FakeTerminationClass)
 	monkeypatch.setattr(execution, "upload_screenshot", AsyncMock(side_effect=["before-url", "after-url"]))
 	monkeypatch.setattr(execution, "stream_event", lambda *args, **kwargs: calls.append((args, kwargs)))

 	await execution.stream_step("runs:testcase:11", step=FakeStep())

 	assert calls[0][0] == ("runs:testcase:11",)
 	assert calls[0][1]["event_type"] == execution.EventType.TEST_STEP
 	assert json.loads(calls[0][1]["event"]) == {
 		"id": 9,
 		"mode": "json",
 		"exclude": ["snapshot_after", "snapshot_before"],
 		"status": "PASSED",
 		"snapshot_before": {"screenshot": "before-url"},
 		"snapshot_after": {"screenshot": "after-url"},
 	}


@pytest.mark.asyncio
async def test_stream_step_handles_termination(monkeypatch):
 	class FakeTermination(FakeTerminationClass):
 		def model_dump_json(self):
 			return json.dumps({"reason": "done"})

 	calls = []
 	monkeypatch.setattr(execution, "TestStep", FakeStepClass)
 	monkeypatch.setattr(execution, "TestTermination", FakeTermination)
 	monkeypatch.setattr(execution, "stream_event", lambda *args, **kwargs: calls.append((args, kwargs)))

 	await execution.stream_step("runs:testcase:11", step=FakeTermination())

 	assert calls[0][1]["event_type"] == execution.EventType.TEST_TERMINATION
 	assert calls[0][1]["event"] == json.dumps({"reason": "done"})


@pytest.mark.asyncio
async def test_stream_step_skips_missing_snapshots(monkeypatch):
	class FakeStep(FakeStepClass):
		def __init__(self):
			self.snapshot_before = None
			self.snapshot_after = None
			self.id = 5

		def model_dump(self, *, mode, exclude):
			return {"id": self.id, "mode": mode, "exclude": sorted(exclude), "status": "PASSED"}

	calls = []
	monkeypatch.setattr(execution, "TestStep", FakeStep)
	monkeypatch.setattr(execution, "TestTermination", FakeTerminationClass)
	monkeypatch.setattr(execution, "upload_screenshot", AsyncMock(side_effect=AssertionError("upload should not be called")))
	monkeypatch.setattr(execution, "stream_event", lambda *args, **kwargs: calls.append((args, kwargs)))

	await execution.stream_step("runs:testcase:11", step=FakeStep())

	payload = json.loads(calls[0][1]["event"])
	assert "snapshot_before" not in payload
	assert "snapshot_after" not in payload



@pytest.mark.asyncio
async def test_persist_step_skips_none_status():
 	session = FakeSession()
 	job = execution.TestCaseJob(1, engine=object(), db_session=session, stream_key="runs:testcase:1", abort_id=1)
 	job.testcase_run = make_case_run()
 	step = SimpleNamespace(status=None)

	screenshot_before, screenshot_after = await job._persist_step(step)

 	assert session.added == []
 	assert session.commit_calls == 0
	assert screenshot_before is None
	assert screenshot_after is None



@pytest.mark.asyncio
async def test_persist_step_creates_test_step_run(monkeypatch):
 	session = FakeSession()
 	job = execution.TestCaseJob(1, engine=object(), db_session=session, stream_key="runs:testcase:1", abort_id=1)
 	job.testcase_run = make_case_run()
 	step = SimpleNamespace(
 		status=DummyStatus("FAILED"),
 		executable=SimpleNamespace(model_dump=lambda mode: {"kind": "click"}),
 		snapshot_before=SimpleNamespace(screenshot=b"before"),
 		snapshot_after=SimpleNamespace(screenshot=b"after"),
 		error_message="boom",
 		action=SimpleNamespace(model_dump_json=lambda: json.dumps({"action": "click"})),
 	)

	monkeypatch.setattr(execution, "upload_screenshot", AsyncMock(side_effect=["before-url", "after-url"]))
	screenshot_before, screenshot_after = await job._persist_step(step)

 	assert len(session.added) == 1
 	step_run = session.added[0]
 	assert isinstance(step_run, TestStepRun)
 	assert step_run.testcase_run_id == 11
 	assert step_run.executable == {"kind": "click"}
	assert step_run.screenshot_before == "before-url"
	assert step_run.screenshot_after == "after-url"
 	assert step_run.error_message == "boom"
 	assert step_run.llm_action == json.dumps({"action": "click"})
 	assert step_run.status == TestCaseStepRunStatus.FAILED
 	assert session.commit_calls == 1
	assert screenshot_before == "before-url"
	assert screenshot_after == "after-url"


def test_finalize_aborted_updates_run_and_streams(monkeypatch):
 	session = FakeSession()
 	run = make_case_run(status=RunStatus.RUNNING)
 	job = execution.TestCaseJob(1, engine=object(), db_session=session, stream_key="runs:testcase:1", abort_id=1)
 	job.testcase_run = run
 	calls = []
 	monkeypatch.setattr(execution, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

 	payload = job._finalize_aborted()

 	assert session.commit_calls == 1
 	assert run.status == RunStatus.ABORTED
 	assert run.termination_reason == "Execution aborted by user"
 	assert calls[0][1]["event"].element == Scope.TESTCASE
 	assert calls[0][1]["event"].status == RunStatus.ABORTED
 	assert payload.status == RunStatus.ABORTED


@pytest.mark.asyncio
async def test_execute_testcase_raises_when_run_missing_async():
 	session = FakeSession(get_result=None)
 	job = execution.TestCaseJob(1, engine=object(), db_session=session, stream_key="runs:testcase:1", abort_id=1)

 	with pytest.raises(ValueError, match="TestCaseRun 1 not found"):
 		await job.execute_testcase()


@pytest.mark.asyncio
async def test_execute_testcase_runs_natural_flow_and_streams(monkeypatch):
	class FakeStep(FakeStepClass):
		pass

	class FakeRunSession:
		def __init__(self, emitted, run):
			self._emitted = list(emitted)
			self._test_run = run
			self.finalize_called = False

		async def __aenter__(self):
			return self

		async def __aexit__(self, exc_type, exc, tb):
			return False

		async def run_loop(self, instruction):
			for item in self._emitted:
				yield item

		def finalize(self):
			self.finalize_called = True

	class FakeEngine:
		def __init__(self, session):
			self.session = session

		def launch(self, base_url):
			return self.session

	run = make_case_run(status=RunStatus.QUEUED)
	session = FakeSession(get_result=run)
	engine_run = SimpleNamespace(status=DummyStatus("PASSED"), finished_at=datetime(2026, 4, 30, 14, 0, 0), current_group=None)
	run_session = FakeRunSession([FakeStep(), FakeStep()], engine_run)
	engine = FakeEngine(run_session)

	stream_step = AsyncMock()
	stream_status_events = []
	persisted = []

	monkeypatch.setattr(execution, "TestStep", FakeStep)
	monkeypatch.setattr(execution, "stream_step", stream_step)
	monkeypatch.setattr(execution, "stream_status", lambda *args, **kwargs: stream_status_events.append(kwargs["event"]))
	async def _persist(self, step):
		persisted.append(step)
		return None, None

	monkeypatch.setattr(execution.TestCaseJob, "_persist_step", _persist)

	job = execution.TestCaseJob(1, engine=engine, db_session=session, stream_key="runs:testcase:1", abort_id=1, stream_steps=True)
	job._is_aborted = lambda: False
	result = await job.execute_testcase()

	assert run.status == RunStatus.PASSED
	assert run.started_at is not None
	assert run.finished_at == datetime(2026, 4, 30, 14, 0, 0)
	assert run.termination_reason is None
	assert [event.status for event in stream_status_events] == [RunStatus.RUNNING, RunStatus.PASSED]
	assert stream_status_events[0].id == 21
	assert len(persisted) == 2
	assert stream_step.await_count == 2
	assert run_session.finalize_called is True
	assert session.commit_calls == 2
	assert result.status == RunStatus.PASSED


@pytest.mark.asyncio
async def test_execute_testcase_skips_streaming_when_disabled(monkeypatch):
	class FakeStep(FakeStepClass):
		pass

	class FakeRunSession:
		def __init__(self, emitted, run):
			self._emitted = list(emitted)
			self._test_run = run

		async def __aenter__(self):
			return self

		async def __aexit__(self, exc_type, exc, tb):
			return False

		async def run_loop(self, instruction):
			for item in self._emitted:
				yield item

		def finalize(self):
			return None

	class FakeEngine:
		def __init__(self, session):
			self.session = session

		def launch(self, base_url):
			return self.session

	run = make_case_run(status=RunStatus.QUEUED)
	session = FakeSession(get_result=run)
	engine_run = SimpleNamespace(status=DummyStatus("PASSED"), finished_at=None, current_group=None)
	run_session = FakeRunSession([FakeStep()], engine_run)
	engine = FakeEngine(run_session)

	persisted = []
	stream_status_events = []

	monkeypatch.setattr(execution, "TestStep", FakeStep)
	monkeypatch.setattr(execution, "stream_step", AsyncMock(side_effect=AssertionError("stream_step should not be called")))
	monkeypatch.setattr(execution, "stream_status", lambda *args, **kwargs: stream_status_events.append(kwargs["event"]))
	async def _persist(self, step):
		persisted.append(step)
		return None, None

	monkeypatch.setattr(execution.TestCaseJob, "_persist_step", _persist)

	job = execution.TestCaseJob(1, engine=engine, db_session=session, stream_key="runs:testcase:1", abort_id=1, stream_steps=False)
	job._is_aborted = lambda: False
	await job.execute_testcase()

	assert len(persisted) == 1
	assert [event.status for event in stream_status_events] == [RunStatus.RUNNING, RunStatus.PASSED]


@pytest.mark.asyncio
async def test_execute_testcase_aborts_mid_run(monkeypatch):
	class FakeStep(FakeStepClass):
		pass

	class FakeRunSession:
		def __init__(self, emitted):
			self._emitted = list(emitted)
			self._test_run = SimpleNamespace(status=DummyStatus("PASSED"), finished_at=None, current_group=None)
			self.finalize_called = False

		async def __aenter__(self):
			return self

		async def __aexit__(self, exc_type, exc, tb):
			return False

		async def run_loop(self, instruction):
			for item in self._emitted:
				yield item

		def finalize(self):
			self.finalize_called = True

	class FakeEngine:
		def __init__(self, session):
			self.session = session

		def launch(self, base_url):
			return self.session

	run = make_case_run(status=RunStatus.QUEUED)
	session = FakeSession(get_result=run)
	run_session = FakeRunSession([FakeStep()])
	engine = FakeEngine(run_session)

	stream_status_events = []
	persisted = []

	monkeypatch.setattr(execution, "TestStep", FakeStep)
	monkeypatch.setattr(execution, "stream_status", lambda *args, **kwargs: stream_status_events.append(kwargs["event"]))
	async def _persist(self, step):
		persisted.append(step)
		return None, None

	monkeypatch.setattr(execution.TestCaseJob, "_persist_step", _persist)

	job = execution.TestCaseJob(1, engine=engine, db_session=session, stream_key="runs:testcase:1", abort_id=1, stream_steps=True)
	job._is_aborted = lambda: True

	result = await job.execute_testcase()

	assert run.status == RunStatus.ABORTED
	assert run.termination_reason == "Execution aborted by user"
	assert [event.status for event in stream_status_events] == [RunStatus.RUNNING, RunStatus.ABORTED]
	assert run_session.finalize_called is False
	assert persisted == []
	assert result.status == RunStatus.ABORTED


def test_execute_testcase_task_run_wraps_job_execution(monkeypatch):
 	class FakeJob:
 		def __init__(self, testcase_run_id, *, engine, db_session, stream_key, abort_id, stream_steps):
 			self.args = (testcase_run_id, engine, db_session, stream_key, abort_id, stream_steps)

 		async def execute_testcase(self):
 			return SimpleNamespace(model_dump=lambda mode="json": {"status": "PASSED", "args": self.args})

 	fake_session = FakeSession()
 	monkeypatch.setattr(tasks, "_build_testing_engine", lambda: "engine")
 	monkeypatch.setattr(tasks, "TestCaseJob", FakeJob)
 	monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(fake_session))

 	result = tasks.ExecuteTestcaseTask().run(7, "stream:1", 9, True)

 	assert result["status"] == "PASSED"
 	assert result["args"][0] == 7
 	assert result["args"][1] == "engine"


def test_execute_testcase_task_on_failure_marks_case_error(monkeypatch):
 	run = make_case_run(status=RunStatus.RUNNING)
 	session = FakeSession(get_result=run)
 	calls = []
 	monkeypatch.setattr(tasks, "Session", lambda db_engine: FakeSessionContext(session))
 	monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

 	task = tasks.ExecuteTestcaseTask()
 	task.on_failure(RuntimeError("boom"), "task-id", args=(11, "stream-key"), kwargs={}, einfo=None)

 	assert run.status == RunStatus.ERROR
 	assert run.termination_reason == "Unexpected Error"
 	assert session.commit_calls == 1
 	assert calls[0][1]["event"].element == Scope.TESTCASE
 	assert calls[0][1]["event"].status == RunStatus.ERROR


def test_finalize_testsuite_task_updates_parent_and_streams(monkeypatch):
 	run = make_suite_run(status=RunStatus.RUNNING)
 	session = FakeSession(get_result=run)
 	calls = []
 	monkeypatch.setattr(tasks, "Session", lambda db_engine, expire_on_commit=None: FakeSessionContext(session))
 	monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

 	result = tasks.finalize_testsuite_task(
 		[
 			{"testcase_run_id": 1, "testcase_id": 10, "status": "PASSED", "finished_at": "2026-04-30T12:00:00"},
 			{"testcase_run_id": 2, "testcase_id": 11, "status": "FAILED", "finished_at": "2026-04-30T13:00:00"},
 		],
 		12,
 		"runs:testsuite:12",
 	)

 	assert run.status == RunStatus.FAILED
 	assert session.commit_calls == 1
 	assert calls[0][1]["event"].element == Scope.TESTSUITE
 	assert calls[0][1]["event"].id == 22
 	assert result["status"] == "FAILED"
 	assert result["testsuite_run_id"] == 12


def test_finalize_project_task_updates_parent_and_streams(monkeypatch):
 	run = make_project_run(status=RunStatus.RUNNING)
 	session = FakeSession(get_result=run)
 	calls = []
 	monkeypatch.setattr(tasks, "Session", lambda db_engine, expire_on_commit=None: FakeSessionContext(session))
 	monkeypatch.setattr(tasks, "stream_status", lambda *args, **kwargs: calls.append((args, kwargs)))

 	result = tasks.finalize_project_task(
 		[
 			{"testsuite_run_id": 1, "testsuite_id": 10, "status": "PASSED", "finished_at": "2026-04-30T12:00:00"},
 			{"testsuite_run_id": 2, "testsuite_id": 11, "status": "PASSED", "finished_at": "2026-04-30T13:00:00"},
 		],
 		13,
 		"runs:project:13",
 	)

 	assert run.status == RunStatus.PASSED
 	assert session.commit_calls == 1
 	assert calls[0][1]["event"].element == Scope.PROJECT
 	assert calls[0][1]["event"].id == 23
 	assert result["status"] == "PASSED"
 	assert result["project_run_id"] == 13


def test_build_testsuite_workflow_composes_chord(monkeypatch):
 	monkeypatch.setattr(tasks, "execute_testcase_task", SimpleNamespace(s=lambda **kwargs: ("execute", kwargs)))
 	monkeypatch.setattr(tasks, "finalize_testsuite_task", SimpleNamespace(s=lambda **kwargs: ("finalize", kwargs)))
 	monkeypatch.setattr(tasks, "group", lambda items: ("group", list(items)))
 	monkeypatch.setattr(tasks, "chord", lambda header, callback: {"header": header, "callback": callback})

 	workflow = tasks.build_testsuite_workflow(
 		testcase_runs_ids=[1, 2],
 		testsuite_run_id=3,
 		stream_key="runs:testsuite:3",
 		abort_id=3,
 		stream_steps=False,
 	)

 	assert workflow["header"][0] == "group"
 	assert workflow["callback"][0] == "finalize"


def test_build_project_workflow_composes_chord(monkeypatch):
 	monkeypatch.setattr(tasks, "finalize_project_task", SimpleNamespace(s=lambda **kwargs: ("finalize", kwargs)))
 	monkeypatch.setattr(tasks, "group", lambda items: ("group", list(items)))
 	monkeypatch.setattr(tasks, "chord", lambda header, callback: {"header": header, "callback": callback})

 	workflow = tasks.build_project_workflow(
 		testsuite_workflows=["suite-a", "suite-b"],
 		project_run_id=13,
 		stream_key="runs:project:13",
 	)

 	assert workflow["header"][0] == "group"
 	assert workflow["callback"][0] == "finalize"


def test_get_stream_key_and_decode_message():
 	assert stream.get_stream_key(Scope.TESTCASE, 7) == "runs:testcase:7"
 	msg_id, payload = stream.decode_message(b"1-0", {b"event": b'{"ok": true}', b"type": b"STATUS_CHANGE", b"count": b"3"})
 	assert msg_id == "1-0"
 	assert payload == {"event": {"ok": True}, "type": "STATUS_CHANGE", "count": 3}


@pytest.mark.asyncio
async def test_abort_and_cleanup_stream_helpers(monkeypatch):
 	class SyncRedis:
 		def __init__(self):
 			self.calls = []
 			self.abort_keys = set()

 		def set(self, key, value, ex=None):
 			self.calls.append(("set", key, value, ex))
 			self.abort_keys.add(key)

 		def exists(self, key):
 			self.calls.append(("exists", key))
 			return key in self.abort_keys

 		def delete(self, key):
 			self.calls.append(("delete", key))

 
 	class AsyncRedis:
 		def __init__(self, sync_redis):
 			self.sync_redis = sync_redis

 		async def set(self, key, value, ex=None):
 			self.sync_redis.set(key, value, ex=ex)

 	sync_redis = SyncRedis()
 	async_redis = AsyncRedis(sync_redis)
 	monkeypatch.setattr(stream, "get_redis_client", lambda: sync_redis)
 	monkeypatch.setattr(stream, "get_aredis_client", lambda: async_redis)

 	stream.abort(9, ttl_seconds=60)
 	assert stream.is_aborted(9) is True
 	stream.cleanup_stream("runs:testcase:9")
 	await stream.abort_async(10, ttl_seconds=30)
 	assert sync_redis.calls[0] == ("set", "aborted:9", 1, 60)
 	assert sync_redis.calls[1] == ("exists", "aborted:9")
 	assert sync_redis.calls[2] == ("delete", "runs:testcase:9")
 	assert sync_redis.calls[3] == ("set", "aborted:10", 1, 30)


def test_testcase_run_dependency_factory_happy_path(monkeypatch):
 	from src.runs.dependencies import _testcase_run_dep_factory

 	run = make_case_run()
 	link = SimpleNamespace(role=ProjectRole.EDITOR)
 	calls = []
 	monkeypatch.setattr(dependencies, "get_testcase_run_by_id_with_user_link", lambda session, testcase_run_id, user_id: (run, link))
 	monkeypatch.setattr(dependencies, "check_project_role", lambda user, user_link, minimum_role: calls.append((user, user_link, minimum_role)))

 	dependency = _testcase_run_dep_factory(ProjectRole.VIEWER)
 	result = dependency(session=object(), user=SimpleNamespace(id=1), testcase_run_id=99)

 	assert result is run
 	assert calls[0][2] == ProjectRole.VIEWER


def test_testsuite_run_dependency_factory_not_found(monkeypatch):
 	from src.runs.dependencies import _testsuite_run_dep_factory
 	from fastapi import HTTPException

 	monkeypatch.setattr(dependencies, "get_testsuite_run_by_id_with_user_link", lambda session, testsuite_run_id, user_id: None)
 	dependency = _testsuite_run_dep_factory(ProjectRole.VIEWER)

 	with pytest.raises(HTTPException, match="Testsuite run not found"):
 		dependency(session=object(), user=SimpleNamespace(id=1), testsuite_run_id=99)


def test_project_run_dependency_factory_happy_path(monkeypatch):
 	from src.runs.dependencies import _project_run_dep_factory

 	run = make_project_run()
 	link = SimpleNamespace(role=ProjectRole.ADMIN)
 	calls = []
 	monkeypatch.setattr(dependencies, "get_project_run_by_id_with_user_link", lambda session, project_run_id, user_id: (run, link))
 	monkeypatch.setattr(dependencies, "check_project_role", lambda user, user_link, minimum_role: calls.append((user, user_link, minimum_role)))

 	dependency = _project_run_dep_factory(ProjectRole.EDITOR)
 	result = dependency(session=object(), user=SimpleNamespace(id=1), project_run_id=99)

 	assert result is run
 	assert calls[0][2] == ProjectRole.EDITOR
