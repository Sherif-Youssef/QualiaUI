import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime

from fastapi import HTTPException

from src.auth.models import Role as UserRole
from src.projects.models import Role as ProjectRole
from src.runs.models import TestRunMode, TestStatus
from src.runs.active.schemas import ActiveRunStatus
from src.runs.active.service import (
	_runs,
	_persist_run,
	_auto_save,
	start_run,
	get_run_status,
	get_testcase_status,
	get_testcase_steps,
	stream_testcase_progress,
	stream_all_progress,
	abort_run,
	abort_testcase,
	RunContext,
)


# helpers


def _make_engine():
	return MagicMock()


def _make_spec(name="tc1", description="d1", instruction=None):
	spec = MagicMock()
	spec.name = name
	spec.description = description
	spec.instruction = instruction
	return spec


def _make_entry(completed=False, steps=None, spec=None):
	entry = MagicMock()
	entry.completed = completed
	entry.steps = steps or []
	entry.spec = spec or _make_spec()
	return entry


def _make_manager(**overrides):
	m = MagicMock()
	m.state = overrides.get("state", {"status": "running"})
	m.steps = MagicMock(return_value=overrides.get("steps_return", []))
	m.indices = overrides.get("indices", [0])
	m.specs = overrides.get("specs", [_make_spec()])
	m.is_done = overrides.get("is_done", False)
	m.is_running = overrides.get("is_running", True)
	m.abort = MagicMock()
	m.abort_testcase = MagicMock()
	m.wait = AsyncMock()
	m.all_results = AsyncMock(return_value=overrides.get("all_results", {}))
	m._entries = overrides.get("entries", {0: _make_entry()})
	return m


def _make_engine_step(status="PASSED", error_message=None):
	step = MagicMock()
	step.executable = MagicMock()
	step.executable.model_dump.return_value = {"action": "click"}
	step.snapshot_before = MagicMock(screenshot="b64before")
	step.snapshot_after = MagicMock(screenshot="b64after")
	step.started_at = datetime(2024, 1, 1, 12, 0, 1)
	step.finished_at = datetime(2024, 1, 1, 12, 0, 2)
	step.status = status
	step.error_message = error_message
	return step


def _make_engine_run(status="PASSED", steps=None):
	run = MagicMock()
	run.status = status
	run.base_url = "https://example.com"
	run.all_steps = steps or [_make_engine_step(status)]
	return run


def _make_mock_session():
	s = MagicMock()
	s.add = MagicMock()
	s.flush = MagicMock()
	s.commit = MagicMock()
	s.refresh = MagicMock()
	return s


def _register_run(run_id, manager, project_id=1, testsuite_id=1):
	ctx = RunContext(
		manager=manager,
		run_id=run_id,
		project_id=project_id,
		testsuite_id=testsuite_id,
		mode=TestRunMode.EXECUTABLE,
		name="Suite",
		description="Test suite",
		started_at=datetime(2024, 1, 1, 12, 0, 0),
	)
	_runs[run_id] = ctx
	return ctx


@pytest.fixture(autouse=True)
def _clear_runs():
	_runs.clear()
	yield
	_runs.clear()


# start_run


@patch("src.runs.active.service.TestRunManager")
@pytest.mark.asyncio
async def test_start_run_requires_editor(
	mock_mgr_cls,
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	viewer = user_factory("viewer_start", "viewer_start@example.com", role=UserRole.VIEWER)
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")
	testcase_factory(
		testsuite.id, "Login", "Test login",
		base_url="https://example.com", instruction="Click login",
	)

	with pytest.raises(HTTPException) as exc:
		await start_run(
			session, viewer, _make_engine(),
			project.id, testsuite.id, TestRunMode.NATURAL,
		)

	assert exc.value.status_code == 403


@patch("src.runs.active.service.asyncio.create_task")
@patch("src.runs.active.service._auto_save")
@patch("src.runs.active.service.TestRunManager")
@pytest.mark.asyncio
async def test_start_run_as_editor(
	mock_mgr_cls,
	mock_auto_save,
	mock_create_task,
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	editor = user_factory("editor_start", "editor_start@example.com", role=UserRole.VIEWER)
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
	testsuite = testsuite_factory(project.id, "Suite", "Test suite")
	testcase_factory(
		testsuite.id, "Login", "Test login",
		base_url="https://example.com", instruction="Click login",
	)

	mock_mgr_cls.return_value = MagicMock(indices=[0])

	result = await start_run(
		session, editor, _make_engine(),
		project.id, testsuite.id, TestRunMode.NATURAL,
	)

	assert result.run_id in _runs
	assert result.status == ActiveRunStatus.RUNNING
	assert result.name == "Suite"
	assert result.mode == TestRunMode.NATURAL
	assert result.indices == [0]
	assert result.finished_at is None
	mock_mgr_cls.return_value.start.assert_called_once()
	mock_create_task.assert_called_once()


@patch("src.runs.active.service.asyncio.create_task")
@patch("src.runs.active.service._auto_save")
@patch("src.runs.active.service.TestRunManager")
@pytest.mark.asyncio
async def test_start_run_stores_context(
	mock_mgr_cls,
	mock_auto_save,
	mock_create_task,
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
	testcase_factory,
):
	editor = user_factory("editor_ctx", "editor_ctx@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
	testsuite = testsuite_factory(project.id, "My Suite", "Suite description")
	testcase_factory(
		testsuite.id, "Login", "desc",
		base_url="https://example.com", instruction="Do login",
	)

	mock_mgr_cls.return_value = MagicMock(indices=[0])

	result = await start_run(
		session, editor, _make_engine(),
		project.id, testsuite.id, TestRunMode.NATURAL,
	)

	ctx = _runs[result.run_id]
	assert isinstance(ctx, RunContext)
	assert ctx.run_id == result.run_id
	assert ctx.project_id == project.id
	assert ctx.testsuite_id == testsuite.id
	assert ctx.mode == TestRunMode.NATURAL
	assert ctx.name == "My Suite"
	assert ctx.description == "Suite description"
	assert ctx.aborted is False
	assert isinstance(ctx.started_at, datetime)


@patch("src.runs.active.service.TestRunManager")
@pytest.mark.asyncio
async def test_start_run_no_testcases_raises(
	mock_mgr_cls,
	session,
	user_factory,
	project_factory,
	project_link_factory,
	testsuite_factory,
):
	editor = user_factory("editor_empty", "editor_empty@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)
	testsuite = testsuite_factory(project.id, "Empty Suite", "No cases")

	with pytest.raises(HTTPException) as exc:
		await start_run(
			session, editor, _make_engine(),
			project.id, testsuite.id, TestRunMode.NATURAL,
		)

	assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_start_run_nonexistent_project(session, user_factory):
	user = user_factory("user_noproject", "user_noproject@example.com")

	with pytest.raises(HTTPException) as exc:
		await start_run(session, user, _make_engine(), 99999, 1, TestRunMode.NATURAL)

	assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_start_run_nonexistent_testsuite(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	editor = user_factory("editor_nots", "editor_nots@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

	with pytest.raises(HTTPException) as exc:
		await start_run(session, editor, _make_engine(), project.id, 99999, TestRunMode.NATURAL)

	assert exc.value.status_code == 404


# get_run_status


def test_get_run_status_requires_viewer(
	session,
	user_factory,
	project_factory,
):
	outsider = user_factory("outsider_status", "outsider_status@example.com")
	project = project_factory("Project", "Test project")

	_register_run("r1", _make_manager(), project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		get_run_status(session, outsider, project.id, "r1")

	assert exc.value.status_code == 403


def test_get_run_status_running(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_status", "viewer_status@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run("r1", _make_manager(is_done=False, is_running=True), project_id=project.id)

	result = get_run_status(session, viewer, project.id, "r1")

	assert result.run_id == "r1"
	assert result.status == ActiveRunStatus.RUNNING
	assert result.finished_at is None
	assert result.name == "Suite"


def test_get_run_status_finished(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_done", "viewer_done@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run("r1", _make_manager(is_done=True, is_running=False), project_id=project.id)

	result = get_run_status(session, viewer, project.id, "r1")

	assert result.status == ActiveRunStatus.FINISHED
	assert result.finished_at is not None


def test_get_run_status_missing_run(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_miss", "viewer_miss@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	with pytest.raises(HTTPException) as exc:
		get_run_status(session, viewer, project.id, "nonexistent")

	assert exc.value.status_code == 404


# get_testcase_status


def test_get_testcase_status_pending(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_tc_pend", "viewer_tc_pend@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	entry = _make_entry(completed=False, steps=[])
	_register_run("r1", _make_manager(entries={0: entry}), project_id=project.id)

	result = get_testcase_status(session, viewer, project.id, "r1", 0)

	assert result.index == 0
	assert result.status == ActiveRunStatus.PENDING
	assert result.finished_at is None


def test_get_testcase_status_running(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_tc_run", "viewer_tc_run@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	spec = _make_spec("Login TC", "desc", "Click login")
	entry = _make_entry(completed=False, steps=["s1"], spec=spec)
	_register_run("r1", _make_manager(entries={0: entry}), project_id=project.id)

	result = get_testcase_status(session, viewer, project.id, "r1", 0)

	assert result.index == 0
	assert result.status == ActiveRunStatus.RUNNING
	assert result.finished_at is None


def test_get_testcase_status_finished(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_tc_done", "viewer_tc_done@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	spec = _make_spec("Login TC", "desc", None)
	entry = _make_entry(completed=True, steps=["s1", "s2"], spec=spec)
	_register_run("r1", _make_manager(entries={0: entry}), project_id=project.id)

	result = get_testcase_status(session, viewer, project.id, "r1", 0)

	assert result.status == ActiveRunStatus.FINISHED
	assert result.finished_at is not None


def test_get_testcase_status_bad_index(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_tc_bad", "viewer_tc_bad@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run("r1", _make_manager(entries={}), project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		get_testcase_status(session, viewer, project.id, "r1", 999)

	assert exc.value.status_code == 404


# get_testcase_steps


@patch("src.runs.active.service._step_to_active")
def test_get_testcase_steps_as_viewer(
	mock_step_to_active,
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_steps", "viewer_steps@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run("r1", _make_manager(steps_return=["raw1", "raw2"]), project_id=project.id)
	mock_step_to_active.side_effect = lambda idx, s: MagicMock(index=idx)

	result = get_testcase_steps(session, viewer, project.id, "r1", 0)

	assert len(result) == 2


@patch("src.runs.active.service._step_to_active")
def test_get_testcase_steps_filters_none(
	mock_step_to_active,
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_filter", "viewer_filter@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run(
		"r1",
		_make_manager(steps_return=["raw1", "non_step", "raw3"]),
		project_id=project.id,
	)
	mock_step_to_active.side_effect = [MagicMock(), None, MagicMock()]

	result = get_testcase_steps(session, viewer, project.id, "r1", 0)

	assert len(result) == 2


def test_get_testcase_steps_bad_index(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_badidx", "viewer_badidx@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	mgr = _make_manager()
	mgr.steps.side_effect = KeyError("bad")
	_register_run("r1", mgr, project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		get_testcase_steps(session, viewer, project.id, "r1", 999)

	assert exc.value.status_code == 404


# stream_testcase_progress


@pytest.mark.asyncio
@patch("src.runs.active.service._step_to_active")
async def test_stream_testcase_progress_as_viewer(
	mock_step_to_active,
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_stream", "viewer_stream@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	mgr = _make_manager()

	async def _fake_progress(idx):
		yield "step1"
		yield "step2"

	mgr.progress = _fake_progress
	_register_run("r1", mgr, project_id=project.id)
	mock_step_to_active.side_effect = lambda idx, s: MagicMock(index=idx)

	collected = []
	async for step in stream_testcase_progress(session, viewer, project.id, "r1", 0):
		collected.append(step)

	assert len(collected) == 2


@pytest.mark.asyncio
@patch("src.runs.active.service._step_to_active")
async def test_stream_testcase_progress_filters_none(
	mock_step_to_active,
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_stream_filt", "viewer_stream_filt@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	mgr = _make_manager()

	async def _fake_progress(idx):
		yield "step1"
		yield "non_step"
		yield "step3"

	mgr.progress = _fake_progress
	_register_run("r1", mgr, project_id=project.id)
	mock_step_to_active.side_effect = [MagicMock(), None, MagicMock()]

	collected = []
	async for step in stream_testcase_progress(session, viewer, project.id, "r1", 0):
		collected.append(step)

	assert len(collected) == 2


@pytest.mark.asyncio
async def test_stream_testcase_progress_bad_index(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_stream_bad", "viewer_stream_bad@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	mgr = _make_manager()

	async def _raise(idx):
		raise KeyError("bad")
		yield  # noqa: unreachable

	mgr.progress = _raise
	_register_run("r1", mgr, project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		async for _ in stream_testcase_progress(session, viewer, project.id, "r1", 999):
			pass

	assert exc.value.status_code == 404


# stream_all_progress


@pytest.mark.asyncio
@patch("src.runs.active.service._step_to_active")
async def test_stream_all_progress_as_viewer(
	mock_step_to_active,
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_all", "viewer_all@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	mgr = _make_manager(indices=[0, 1])

	async def _fake_progress(idx):
		yield f"step-{idx}-a"
		yield f"step-{idx}-b"

	mgr.progress = _fake_progress
	_register_run("r1", mgr, project_id=project.id)
	mock_step_to_active.side_effect = lambda idx, s: MagicMock(index=idx)

	collected = []
	async for item in stream_all_progress(session, viewer, project.id, "r1"):
		collected.append(item)

	assert len(collected) == 4
	indices_seen = {s.index for s in collected}
	assert indices_seen == {0, 1}


@pytest.mark.asyncio
@patch("src.runs.active.service._step_to_active")
async def test_stream_all_progress_single_index(
	mock_step_to_active,
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_all_single", "viewer_all_single@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	mgr = _make_manager(indices=[0])

	async def _fake_progress(idx):
		yield "only-step"

	mgr.progress = _fake_progress
	_register_run("r1", mgr, project_id=project.id)
	mock_step_to_active.side_effect = lambda idx, s: MagicMock(index=idx)

	collected = []
	async for item in stream_all_progress(session, viewer, project.id, "r1"):
		collected.append(item)

	assert len(collected) == 1


# _persist_run


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_basic(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	mock_session = _make_mock_session()

	engine_run = _make_engine_run("PASSED")
	mgr = _make_manager(indices=[0], is_done=True)
	mgr.all_results = AsyncMock(return_value={0: engine_run})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	result = await _persist_run(mock_session, "r1")

	mock_session.commit.assert_called_once()
	mock_session.refresh.assert_called_once()
	assert result == mock_tr_cls.return_value


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_waits_if_not_done(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	mock_session = _make_mock_session()

	engine_run = _make_engine_run("PASSED")
	mgr = _make_manager(indices=[0], is_done=False)
	mgr.all_results = AsyncMock(return_value={0: engine_run})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	mgr.wait.assert_awaited_once()


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_status_passed(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	mock_session = _make_mock_session()

	mgr = _make_manager(indices=[0], is_done=True)
	mgr.all_results = AsyncMock(return_value={0: _make_engine_run("PASSED")})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	call_kwargs = mock_tr_cls.call_args[1]
	assert call_kwargs["status"] == TestStatus.PASSED


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_status_failed(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	mock_session = _make_mock_session()

	mgr = _make_manager(
		indices=[0, 1], is_done=True,
		specs=[_make_spec("tc1", "d1"), _make_spec("tc2", "d2")],
	)
	mgr.all_results = AsyncMock(return_value={
		0: _make_engine_run("PASSED"),
		1: _make_engine_run("FAILED"),
	})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	call_kwargs = mock_tr_cls.call_args[1]
	assert call_kwargs["status"] == TestStatus.FAILED


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_status_aborted(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	"""ABORTED is the last in the priority loop, so it wins over ERROR and FAILED."""
	mock_session = _make_mock_session()

	mgr = _make_manager(
		indices=[0, 1, 2], is_done=True,
		specs=[_make_spec("tc1", "d1"), _make_spec("tc2", "d2"), _make_spec("tc3", "d3")],
	)
	mgr.all_results = AsyncMock(return_value={
		0: _make_engine_run("ERROR"),
		1: _make_engine_run("FAILED"),
		2: _make_engine_run("ABORTED"),
	})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	call_kwargs = mock_tr_cls.call_args[1]
	assert call_kwargs["status"] == TestStatus.ABORTED


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_error_and_failed_resolves_to_failed(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	"""With ERROR and FAILED present, the priority loop overwrites in order so FAILED wins."""
	mock_session = _make_mock_session()

	mgr = _make_manager(
		indices=[0, 1], is_done=True,
		specs=[_make_spec("tc1", "d1"), _make_spec("tc2", "d2")],
	)
	mgr.all_results = AsyncMock(return_value={
		0: _make_engine_run("ERROR"),
		1: _make_engine_run("FAILED"),
	})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	call_kwargs = mock_tr_cls.call_args[1]
	assert call_kwargs["status"] == TestStatus.FAILED


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_only_error_resolves_to_error(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	"""With only ERROR present, overall status is ERROR."""
	mock_session = _make_mock_session()

	mgr = _make_manager(indices=[0], is_done=True)
	mgr.all_results = AsyncMock(return_value={0: _make_engine_run("ERROR")})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	call_kwargs = mock_tr_cls.call_args[1]
	assert call_kwargs["status"] == TestStatus.ERROR


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_multiple_steps(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	mock_session = _make_mock_session()

	steps = [_make_engine_step("PASSED"), _make_engine_step("PASSED"), _make_engine_step("FAILED")]
	mgr = _make_manager(indices=[0], is_done=True)
	mgr.all_results = AsyncMock(return_value={0: _make_engine_run("FAILED", steps)})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	assert mock_tsr_cls.call_count == 3


@pytest.mark.asyncio
async def test_persist_run_missing_run():
	mock_session = _make_mock_session()

	with pytest.raises(HTTPException) as exc:
		await _persist_run(mock_session, "nonexistent")

	assert exc.value.status_code == 404


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_returns_test_run(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	"""_persist_run returns the created TestRun ORM object."""
	mock_session = _make_mock_session()

	engine_run = _make_engine_run("PASSED")
	mgr = _make_manager(indices=[0], is_done=True)
	mgr.all_results = AsyncMock(return_value={0: engine_run})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=42)
	mock_tcr_cls.return_value = MagicMock(id=200)

	result = await _persist_run(mock_session, "r1")

	assert result.id == 42


@pytest.mark.asyncio
@patch("src.runs.active.service.TestStepRun")
@patch("src.runs.active.service.TestCaseRun")
@patch("src.runs.active.service.TestRun")
async def test_persist_run_stores_run_uid(mock_tr_cls, mock_tcr_cls, mock_tsr_cls):
	"""_persist_run passes the run_id as run_uid to TestRun."""
	mock_session = _make_mock_session()

	engine_run = _make_engine_run("PASSED")
	mgr = _make_manager(indices=[0], is_done=True)
	mgr.all_results = AsyncMock(return_value={0: engine_run})
	_register_run("r1", mgr)

	mock_tr_cls.return_value = MagicMock(id=100)
	mock_tcr_cls.return_value = MagicMock(id=200)

	await _persist_run(mock_session, "r1")

	call_kwargs = mock_tr_cls.call_args[1]
	assert call_kwargs["run_uid"] == "r1"


# _auto_save


@pytest.mark.asyncio
@patch("src.runs.active.service._persist_run", new_callable=AsyncMock)
async def test_auto_save_calls_persist_and_removes_run(mock_persist):
	mock_session = _make_mock_session()

	mgr = _make_manager(is_done=False)
	mgr.wait = AsyncMock()
	_register_run("r1", mgr)

	assert "r1" in _runs

	await _auto_save("r1", mock_session)

	mgr.wait.assert_awaited_once()
	mock_persist.assert_awaited_once_with(mock_session, run_id="r1")
	assert "r1" not in _runs


@pytest.mark.asyncio
@patch("src.runs.active.service._persist_run", new_callable=AsyncMock)
async def test_auto_save_skips_persist_when_aborted(mock_persist):
	mock_session = _make_mock_session()

	mgr = _make_manager(is_done=False)
	mgr.wait = AsyncMock()
	ctx = _register_run("r1", mgr)
	ctx.aborted = True

	await _auto_save("r1", mock_session)

	mgr.wait.assert_awaited_once()
	mock_persist.assert_not_awaited()
	assert "r1" not in _runs


@pytest.mark.asyncio
@patch("src.runs.active.service._persist_run", new_callable=AsyncMock)
async def test_auto_save_removes_run_on_exception(mock_persist):
	mock_session = _make_mock_session()

	mgr = _make_manager(is_done=False)
	mgr.wait = AsyncMock(side_effect=Exception("boom"))
	_register_run("r1", mgr)

	await _auto_save("r1", mock_session)

	mock_persist.assert_not_awaited()
	assert "r1" not in _runs


@pytest.mark.asyncio
@patch("src.runs.active.service._persist_run", new_callable=AsyncMock)
async def test_auto_save_nonexistent_run_noop(mock_persist):
	mock_session = _make_mock_session()

	await _auto_save("nonexistent", mock_session)

	mock_persist.assert_not_awaited()


# abort_run


def test_abort_run_requires_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_abort", "viewer_abort@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run("r1", _make_manager(), project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		abort_run(session, viewer, project.id, "r1")

	assert exc.value.status_code == 403


def test_abort_run_as_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	editor = user_factory("editor_abort", "editor_abort@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

	mgr = _make_manager()
	ctx = _register_run("r1", mgr, project_id=project.id)

	abort_run(session, editor, project.id, "r1")

	mgr.abort.assert_called_once()
	assert ctx.aborted is True


def test_abort_run_missing(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	editor = user_factory("editor_abort_miss", "editor_abort_miss@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

	with pytest.raises(HTTPException) as exc:
		abort_run(session, editor, project.id, "nope")

	assert exc.value.status_code == 404


# abort_testcase


def test_abort_testcase_requires_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	viewer = user_factory("viewer_abort_tc", "viewer_abort_tc@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(viewer.id, project.id, ProjectRole.VIEWER)

	_register_run("r1", _make_manager(), project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		abort_testcase(session, viewer, project.id, "r1", 0)

	assert exc.value.status_code == 403


def test_abort_testcase_as_editor(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	editor = user_factory("editor_abort_tc", "editor_abort_tc@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

	mgr = _make_manager()
	_register_run("r1", mgr, project_id=project.id)

	abort_testcase(session, editor, project.id, "r1", 0)

	mgr.abort_testcase.assert_called_once_with(0)


def test_abort_testcase_bad_index(
	session,
	user_factory,
	project_factory,
	project_link_factory,
):
	editor = user_factory("editor_abort_tc_bad", "editor_abort_tc_bad@example.com")
	project = project_factory("Project", "Test project")
	project_link_factory(editor.id, project.id, ProjectRole.EDITOR)

	mgr = _make_manager()
	mgr.abort_testcase.side_effect = KeyError("bad")
	_register_run("r1", mgr, project_id=project.id)

	with pytest.raises(HTTPException) as exc:
		abort_testcase(session, editor, project.id, "r1", 999)

	assert exc.value.status_code == 404