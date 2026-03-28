# run_manager.py

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable

from sqlmodel import Session

from automation_engine.testing.engine import TestingEngine, TestingSession
from automation_engine.testing.history import (
    TestStep as EngineTestStep,
    TestTermination,
    TestRun as EngineTestRun,
    TestStatus as EngineTestStatus,
)
from automation_engine.compilation import ExecAction

from .models import (
    TestRun as DBTestRun,
    TestCaseRun as DBTestCaseRun,
    TestStepRun as DBTestStepRun,
    TestRunMode,
    TestStatus as DBTestStatus,
)


logger = logging.getLogger(__name__)


def _map_status(status: EngineTestStatus) -> DBTestStatus:
    return DBTestStatus(status.value)


# Input / active-run data structures

@dataclass
class TestCaseInput:
    """One test-case worth of work fed into a run."""
    name: str = ""
    description: str = ""
    instruction: str | None = None           # NATURAL mode
    executables: list[ExecAction] | None = None  # EXECUTABLE mode


@dataclass
class ActiveRun:
    """In-memory handle for a run that is currently executing."""
    run_id: str
    project_id: int
    mode: TestRunMode
    base_url: str
    cases: list[TestCaseInput]
    name: str = ""
    description: str = ""

    # internal state (not supplied by caller)
    testing_session: TestingSession | None = field(default=None, init=False, repr=False)
    engine_run: EngineTestRun | None = field(default=None, init=False, repr=False)
    task: asyncio.Task | None = field(default=None, init=False, repr=False)
    abort_event: asyncio.Event = field(default_factory=asyncio.Event, init=False, repr=False)
    step_queue: asyncio.Queue[EngineTestStep | TestTermination | None] = field(
        default_factory=asyncio.Queue, init=False, repr=False,
    )
    # None pushed to queue ↑ is the "run finished" sentinel


# Manager

class RunManager:
    """
    Keeps active test runs in memory, drives the automation engine,
    and persists results to the database once a run completes (or is aborted).

    Usage:
        manager = RunManager(engine, session_factory)
        active = manager.start_run(...)          # fire-and-forget task
        step = await active.step_queue.get()     # consume live steps (WS)
        await manager.abort_run(run_id)          # client-initiated abort
    """

    def __init__(
        self,
        engine: TestingEngine,
        session_factory: Callable[[], Session],
    ) -> None:
        self._engine = engine
        self._session_factory = session_factory
        self._active_runs: dict[str, ActiveRun] = {}


    @property
    def active_runs(self) -> dict[str, ActiveRun]:
        return dict(self._active_runs)

    def get_active_run(self, run_id: str) -> ActiveRun | None:
        return self._active_runs.get(run_id)

    def start_run(
        self,
        run_id: str,
        project_id: int,
        mode: TestRunMode,
        base_url: str,
        cases: list[TestCaseInput],
        name: str = "",
        description: str = "",
    ) -> ActiveRun:
        if run_id in self._active_runs:
            raise ValueError(f"Run {run_id} is already active")

        active = ActiveRun(
            run_id=run_id,
            project_id=project_id,
            mode=mode,
            base_url=base_url,
            cases=cases,
            name=name,
            description=description,
        )
        self._active_runs[run_id] = active
        active.task = asyncio.create_task(self._execute_run(active))
        return active

    async def abort_run(self, run_id: str) -> None:
        active = self._active_runs.get(run_id)
        if not active:
            raise ValueError(f"No active run with id {run_id}")
        active.abort_event.set()
        if active.task and not active.task.done():
            active.task.cancel()
            try:
                await active.task
            except asyncio.CancelledError:
                pass


    async def _execute_run(self, active: ActiveRun) -> None:
        try:
            async with self._engine.launch(active.base_url) as session:
                active.testing_session = session

                if active.mode == TestRunMode.NATURAL:
                    await self._run_natural(active, session)
                else:
                    await self._run_executable(active, session)

                active.engine_run = session.finalize()

        except asyncio.CancelledError:
            logger.info(f"Run {active.run_id} was cancelled/aborted")
            self._try_finalize_on_abort(active)
        except Exception:
            logger.exception(f"Run {active.run_id} crashed")
            self._try_finalize_on_abort(active)
        finally:
            await active.step_queue.put(None)   # done sentinel
            self._persist_run(active)
            self._active_runs.pop(active.run_id, None)

    async def _run_natural(
        self, active: ActiveRun, session: TestingSession
    ) -> None:
        for case in active.cases:
            if active.abort_event.is_set():
                break
            if not case.instruction:
                continue

            async for step_or_term in session.run_loop(case.instruction):
                if active.abort_event.is_set():
                    break
                await active.step_queue.put(step_or_term)

            # run_loop finalises its own group; belt-and-suspenders check:
            cg = session._test_run.current_group
            if cg and not cg.is_finalized:
                session.finalize_group()

    async def _run_executable(
        self, active: ActiveRun, session: TestingSession
    ) -> None:
        for case in active.cases:
            if active.abort_event.is_set():
                break
            if not case.executables:
                continue

            for exec_action in case.executables:
                if active.abort_event.is_set():
                    break

                step = await session.run_exec(exec_action)
                await active.step_queue.put(step)

                if step.status in (EngineTestStatus.FAILED, EngineTestStatus.ERROR):
                    break

            # Each case → one group; finalise it before moving to the next
            cg = session._test_run.current_group
            if cg and not cg.is_finalized:
                session.finalize_group()


    def _try_finalize_on_abort(self, active: ActiveRun) -> None:
        """Best-effort finalisation when a run is aborted or crashes."""
        if not active.testing_session or not active.testing_session._test_run:
            return
        try:
            tr = active.testing_session._test_run
            cg = tr.current_group
            if cg and not cg.is_finalized:
                cg.finalize(abort_reason="Aborted by user")
            if not tr.is_finalized:
                tr.finalize()
            active.engine_run = tr
        except Exception:
            logger.warning(
                f"Could not cleanly finalise aborted run {active.run_id}",
                exc_info=True,
            )


    def _persist_run(self, active: ActiveRun) -> None:
        engine_run = active.engine_run
        if not engine_run:
            logger.warning(f"Nothing to persist for run {active.run_id}")
            return

        now = datetime.now

        with self._session_factory() as db:
            # 1. TestRun row
            db_run = DBTestRun(
                project_id=active.project_id,
                name=active.name,
                description=active.description,
                mode=active.mode,
                started_at=engine_run.started_at,
                finished_at=engine_run.finished_at or now(),
                status=_map_status(engine_run.status),
            )
            db.add(db_run)
            db.flush()

            # 2. One TestCaseRun per engine group
            for group in engine_run.groups:
                termination_reason = group.abort_reason or ""
                if not termination_reason and group.term:
                    termination_reason = str(group.term.term_signal)

                db_case = DBTestCaseRun(
                    testrun_id=db_run.id,
                    name=(
                        active.cases[group.index].name
                        if group.index is not None and group.index < len(active.cases)
                        else f"Group {group.index}"
                    ),
                    description=(
                        active.cases[group.index].description
                        if group.index is not None and group.index < len(active.cases)
                        else ""
                    ),
                    instruction=group.instruction,
                    started_at=group.started_at,
                    finished_at=group.finished_at or now(),
                    status=_map_status(group.status),
                    termination_reason=termination_reason,
                )
                db.add(db_case)
                db.flush()

                # 3. One TestStepRun per engine step
                for step in group.steps:
                    db_step = DBTestStepRun(
                        testcaserun_id=db_case.id,
                        executable=(
                            step.executable.model_dump()
                            if step.executable
                            else None
                        ),
                        screenshot_before=(
                            step.snapshot_before.screenshot
                            if step.snapshot_before
                            else None
                        ),
                        screenshot_after=(
                            step.snapshot_after.screenshot
                            if step.snapshot_after
                            else None
                        ),
                        started_at=step.started_at,
                        finished_at=step.finished_at or now(),
                        status=_map_status(step.status),
                    )
                    db.add(db_step)

            db.commit()
            logger.info(
                f"Persisted run {active.run_id} → DB TestRun id={db_run.id}"
            )