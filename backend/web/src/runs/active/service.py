import asyncio
import uuid

from typing import AsyncGenerator
from dataclasses import dataclass
from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session

from automation_engine import (
    TestingEngine,
    ExecActionInput,
    TestStep as EngineTestStep,
    TestTermination as EngineTestTermination,
    Complete as EngineComplete
)

from src.auth.models import User
from src.projects.models import Role as ProjectRole
from src.projects.queries import get_with_link
from src.projects.service import check_project_role
from src.testcases.models import TestCase
from src.testsuites.queries import get_by_id as get_testsuite_by_id

from ..models import TestRun, TestCaseRun, TestStepRun, TestStatus, TestRunMode
from .queries import get_all_testcases
from .schemas import ActiveRunStatus, ActiveTestRun, ActiveTestCaseRun, ActiveTestStepRun, ActiveTestCaseTermination
from .run_manager import TestRunManager, TestCaseSpec


@dataclass
class RunContext:
    manager: TestRunManager
    run_id: str
    project_id: int
    testsuite_id: int
    mode: TestRunMode
    started_at: datetime
    aborted: bool = False


# in-memory registry of active runs
_runs: dict[str, RunContext] = {}


def _require_project_access(
    session: Session,
    user: User,
    project_id: int,
    role: ProjectRole,
) -> None:
    project_with_link = get_with_link(session, project_id, user.id)
    if not project_with_link:
        raise HTTPException(status_code=404, detail="Project not found")

    _, user_project_link = project_with_link
    check_project_role(user, user_project_link, role)


def _require_testsuite_access(
    session: Session,
    user: User,
    project_id: int,
    testsuite_id: int,
    role: ProjectRole,
) -> None:
    _require_project_access(session, user, project_id, role)

    testsuite = get_testsuite_by_id(session, project_id, testsuite_id)
    if not testsuite:
        raise HTTPException(status_code=404, detail="Test suite not found")


def _get_context(run_id: str) -> RunContext:
    if run_id not in _runs:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return _runs[run_id]


def _build_specs(session: Session, testsuite_id: int, mode: TestRunMode) -> list[TestCaseSpec]:
    testcases = get_all_testcases(session, testsuite_id)
    if not testcases:
        raise HTTPException(status_code=400, detail="Test suite has no test cases")

    specs = []
    for tc in testcases:
        if mode == TestRunMode.EXECUTABLE:
            if not tc.executable_steps:
                raise HTTPException(status_code=400, detail=f"Test case '{tc.name}' has no executable steps")
            specs.append(TestCaseSpec(
                metadata={"id": tc.id},
                url=tc.base_url,
                executable_steps=[ExecActionInput(**s) for s in tc.executable_steps],
            ))

        elif mode == TestRunMode.NATURAL:
            specs.append(TestCaseSpec(
                metadata={"id": tc.id},
                url=tc.base_url,
                instruction=tc.instruction,
            ))

    return specs


def _resolve_run_status(ctx: RunContext) -> ActiveRunStatus:
    if ctx.manager.is_done:
        return ActiveRunStatus.FINISHED
    if ctx.manager.is_running:
        return ActiveRunStatus.RUNNING
    return ActiveRunStatus.PENDING


def _resolve_case_status(ctx: RunContext, index: int) -> ActiveRunStatus:
    entry = ctx.manager._entries.get(index)
    if entry is None:
        return ActiveRunStatus.PENDING
    if entry.completed:
        return ActiveRunStatus.FINISHED
    if len(entry.steps) > 0:
        return ActiveRunStatus.RUNNING
    return ActiveRunStatus.PENDING


def _step_to_active(
    index: int,
    step: EngineTestStep | EngineTestTermination
) -> ActiveTestStepRun | ActiveTestCaseTermination | None:

    if isinstance(step, EngineTestStep):
        return ActiveTestStepRun(
            index=index,
            executable=step.executable.model_dump() if step.executable else None,
            screenshot_before=step.snapshot_before.screenshot if step.snapshot_before else None,
            screenshot_after=step.snapshot_after.screenshot if step.snapshot_after else None,
            llm_action=step.action.recreation_prompt if step.action else None,
            started_at=step.started_at,
            finished_at=step.finished_at,
            status=TestStatus(step.status),
        )
    elif isinstance(step, EngineTestTermination):
        return ActiveTestCaseTermination(
            status=TestStatus.PASSED if isinstance(step.term_signal, EngineComplete) else TestStatus.FAILED,
            reason=step.term_signal.reason,
        )
    else:
        return None


# Database

async def _persist_run(
    session: Session,
    run_id: str,
) -> TestRun:
    ctx = _get_context(run_id)
    manager = ctx.manager

    if not manager.is_done:
        await manager.wait()

    results = await manager.all_results()
    finished_at = datetime.now()

    # determine overall status
    statuses = []
    for engine_run in results.values():
        if engine_run is not None:
            statuses.append(TestStatus(engine_run.status))
    
    overall_status = None
    for nxt in (TestStatus.ERROR, TestStatus.FAILED, TestStatus.ABORTED):
        if nxt in statuses:
                overall_status = nxt

    if overall_status is None:
        overall_status = TestStatus.PASSED

    testsuite = get_testsuite_by_id(
        session,
        project_id=ctx.project_id,
        testsuite_id=ctx.testsuite_id
    )
    testcases = get_all_testcases(session, ctx.testsuite_id)
    testcases_by_id = {tc.id: tc for tc in testcases}

    # create TestRun
    test_run = TestRun(
        run_uid=run_id,
        project_id=ctx.project_id,
        name=testsuite.name,
        description=testsuite.description,
        mode=ctx.mode,
        started_at=ctx.started_at,
        finished_at=finished_at,
        status=overall_status,
    )
    session.add(test_run)
    session.flush()

    # create TestCaseRun + TestStepRun per index
    for idx in manager.indices:
        spec = manager.specs[idx]
        engine_run = results.get(idx)
        steps = engine_run.all_steps

        case_status = TestStatus(engine_run.status)

        testcase = testcases_by_id[spec.metadata["id"]]

        if engine_run.status == TestStatus.PASSED:
            executables = [step.executable.model_dump() for step in steps]
            testcase.executable_steps = executables
            session.add(testcase)

        case_run = TestCaseRun(
            testrun_id=test_run.id,
            base_url=engine_run.base_url,
            name=testcase.name,
            description=testcase.description,
            instruction=spec.instruction,
            started_at=ctx.started_at,
            finished_at=finished_at,
            status=case_status,
            termination_reason=(
                engine_run.groups[-1].term.term_signal.reason
                if engine_run.groups[-1].term
                else None
            )
        )
        session.add(case_run)
        session.flush()

        for step in steps:
            # skip non-step items like termination or abort events

            step_run = TestStepRun(
                testcaserun_id=case_run.id,
                executable=step.executable.model_dump() if step.executable else None,
                screenshot_before=step.snapshot_before.screenshot if step.snapshot_before else None,
                screenshot_after=step.snapshot_after.screenshot if step.snapshot_after else None,
                llm_action=step.action.recreation_prompt if step.action else None,
                started_at=step.started_at,
                finished_at=step.finished_at,
                status=TestStatus(step.status),
                error_message=step.error_message,
            )
            session.add(step_run)

    session.commit()
    session.refresh(test_run)
    
    return test_run


# auto-save background task

async def _auto_save(run_id: str, session: Session) -> None:
    ctx = _runs.get(run_id)
    if not ctx:
        return

    try:
        await ctx.manager.wait()

        if ctx.aborted:
            return

        await _persist_run(session, run_id=run_id)

    except Exception:
        pass
    finally:
        _runs.pop(run_id, None)


# start a run

async def start_run(
    session: Session,
    user: User,
    engine: TestingEngine,
    project_id: int,
    testsuite_id: int,
    mode: TestRunMode,
) -> ActiveTestRun:
    _require_testsuite_access(session, user, project_id, testsuite_id, ProjectRole.EDITOR)

    testsuite = get_testsuite_by_id(session, project_id, testsuite_id)
    specs = _build_specs(session, testsuite_id, mode)

    run_id = str(uuid.uuid4())
    manager = TestRunManager(engine, specs)
    manager.start()

    ctx = RunContext(
        run_id=run_id,
        manager=manager,
        project_id=project_id,
        testsuite_id=testsuite_id,
        mode=mode,
        started_at=datetime.now(),
    )
    _runs[run_id] = ctx

    # auto-save when complete
    asyncio.create_task(_auto_save(run_id))

    return ActiveTestRun(
        run_id=run_id,
        indices=ctx.manager.indices,
        name=testsuite.name,
        description=testsuite.description,
        mode=ctx.mode,
        started_at=ctx.started_at,
        finished_at=None,
        status=ActiveRunStatus.RUNNING,
    )


# status
def list_testsuite_runs(
    session: Session,
    user: User,
    project_id: int,
) -> list[ActiveTestRun]:
    run_ids = [ctx.run_id for ctx in _runs.values() if ctx.project_id == project_id]
    return [get_run_status(session, user, project_id, run_id) for run_id in run_ids]


def get_run_status(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
) -> ActiveTestRun:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)
    ctx = _get_context(run_id)

    return ActiveTestRun(
        run_id=run_id,
        indices=ctx.manager.indices,
        name=ctx.name,
        description=ctx.description,
        mode=ctx.mode,
        started_at=ctx.started_at,
        finished_at=datetime.now() if ctx.manager.is_done else None,
        status=_resolve_run_status(ctx),
    )


def get_testcase_status(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
    index: int,
) -> ActiveTestCaseRun:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)
    ctx = _get_context(run_id)

    try:
        entry = ctx.manager._entries[index]
    except KeyError:
        raise HTTPException(status_code=404, detail=f"No testcase at index {index}")

    spec = entry.spec
    return ActiveTestCaseRun(
        index=index,
        name=spec.name,
        description=spec.description,
        instruction=spec.instruction,
        started_at=ctx.started_at,
        finished_at=datetime.now() if entry.completed else None,
        status=_resolve_case_status(ctx, index),
    )


# steps snapshot for one testcase

def get_testcase_steps(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
    index: int,
) -> list[ActiveTestStepRun]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)
    ctx = _get_context(run_id)

    try:
        raw_steps = ctx.manager.steps(index)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"No testcase at index {index}")

    return [
        active
        for step in raw_steps
        if (active := _step_to_active(index, step)) is not None
    ]


# progress stream for one testcase

async def stream_testcase_progress(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
    index: int,
) -> AsyncGenerator[ActiveTestStepRun, None]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)
    ctx = _get_context(run_id)

    try:
        async for step in ctx.manager.progress(index):
            active = _step_to_active(index, step)
            if active is not None:
                yield active
    except KeyError:
        raise HTTPException(status_code=404, detail=f"No testcase at index {index}")


# progress stream for all testcases

async def stream_all_progress(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
) -> AsyncGenerator[ActiveTestStepRun, None]:
    _require_project_access(session, user, project_id, ProjectRole.VIEWER)
    ctx = _get_context(run_id)
    manager = ctx.manager

    queue: asyncio.Queue[ActiveTestStepRun | None] = asyncio.Queue()

    async def _pump(idx: int):
        async for step in manager.progress(idx):
            active = _step_to_active(idx, step)
            if active is not None:
                await queue.put(active)

    tasks = [asyncio.create_task(_pump(i)) for i in manager.indices]

    async def _sentinel():
        await asyncio.gather(*tasks, return_exceptions=True)
        await queue.put(None)

    sentinel_task = asyncio.create_task(_sentinel())

    try:
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
    finally:
        sentinel_task.cancel()
        for t in tasks:
            if not t.done():
                t.cancel()


# abort

def abort_run(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
) -> None:
    _require_project_access(session, user, project_id, ProjectRole.EDITOR)
    ctx = _get_context(run_id)
    ctx.aborted = True
    ctx.manager.abort()


# NOTE: Not supported yet
def abort_testcase(
    session: Session,
    user: User,
    project_id: int,
    run_id: str,
    index: int,
) -> None:
    _require_project_access(session, user, project_id, ProjectRole.EDITOR)
    ctx = _get_context(run_id)

    try:
        ctx.manager.abort_testcase(index)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"No testcase at index {index}")


# Raw stuff, NOTE: TO BE UPDATED

async def stream_testcase_progress_raw(
    ctx: RunContext,
    index: int,
) -> AsyncGenerator[ActiveTestStepRun, None]:
    async for step in ctx.manager.progress(index):
        active = _step_to_active(index, step)
        if active is not None:
            yield active


async def stream_all_progress_raw(
    ctx: RunContext,
) -> AsyncGenerator[ActiveTestStepRun, None]:
    manager = ctx.manager
    queue: asyncio.Queue[ActiveTestStepRun | None] = asyncio.Queue()

    async def _pump(idx: int):
        async for step in manager.progress(idx):
            active = _step_to_active(idx, step)
            if active is not None:
                await queue.put(active)

    tasks = [asyncio.create_task(_pump(i)) for i in manager.indices]

    async def _sentinel():
        await asyncio.gather(*tasks, return_exceptions=True)
        await queue.put(None)

    sentinel_task = asyncio.create_task(_sentinel())

    try:
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
    finally:
        sentinel_task.cancel()
        for t in tasks:
            if not t.done():
                t.cancel()
