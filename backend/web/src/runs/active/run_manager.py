import asyncio
from typing import AsyncGenerator, Optional
from pydantic import BaseModel, Field

from automation_engine import TestingEngine, ExecAction, TestRun

from .test_job import TestJob, StepType


class TestCaseSpec(BaseModel):
    """
    Pure data describing a single test case — no DB, no ORM.
    Provide *either* executable_steps (for EXECUTABLE mode)
    or instruction (for NATURAL mode).
    """
    url: str
    metadata: dict | None = None
    executable_steps: list[ExecAction] | None = None
    instruction: str | None = None
    max_steps: int | None = None


class TestCaseEntry(BaseModel):
    spec: TestCaseSpec
    job: TestJob
    steps: list[StepType] = Field(default_factory=list)
    completed: bool = False
    condition: asyncio.Condition = Field(default_factory=asyncio.Condition)


class TestRunManager:
    """
    Orchestrates running a list of TestCaseSpecs as independent TestJobs.

    Usage:
        specs = [
            TestCaseSpec(url="https://example.com", executable_steps=[...]),
            TestCaseSpec(url="https://example.com", executable_steps=[...]),
        ]
        manager = TestRunManager(engine, specs)
        manager.start()
        async for step in manager.progress(0):
            ...
        await manager.wait()
    """

    def __init__(
        self,
        engine: TestingEngine,
        specs: list[TestCaseSpec],
        concurrency: int = 5,
    ):
        if not specs:
            raise ValueError("specs must not be empty")
        
        for i, spec in enumerate(specs):
            if (not spec.instruction) == (not spec.executable_steps):
                raise ValueError(
                    f"Exactly one of instruction or executable_steps "
                    f"should be specified per test (spec index {i})"
                )

        self._engine = engine
        self._concurrency = concurrency
        self._specs = specs

        # internal state
        self._entries: dict[int, TestCaseEntry] = {}
        self._orchestrator_task: Optional[asyncio.Task] = None
        self._done = asyncio.Event()

    #  Public API
    
    @property
    def specs(self):
        return self._specs

    @property
    def indices(self) -> list[int]:
        """Return the index of every test case."""
        return list(range(len(self._specs)))

    @property
    def is_running(self) -> bool:
        return self._orchestrator_task is not None and not self._done.is_set()

    @property
    def is_done(self) -> bool:
        return self._done.is_set()

    # lifecycle 

    def start(self) -> None:
        """Create a TestJob per spec and begin the orchestration loop."""
        if self._orchestrator_task is not None:
            raise RuntimeError("TestRunManager already started")

        for idx, spec in enumerate(self._specs):
            self._entries[idx] = TestCaseEntry(
                spec=spec,
                job=TestJob(self._engine, spec.url),
            )

        self._orchestrator_task = asyncio.create_task(self._orchestrate())

    def abort(self) -> None:
        """Cancel all running jobs and the orchestrator itself."""
        for entry in self._entries.values():
            entry.job.abort()
        if self._orchestrator_task:
            self._orchestrator_task.cancel()

    def abort_testcase(self, index: int) -> None:
        """Cancel a single test case's job by index."""
        self._get(index).job.abort()

    async def wait(self) -> None:
        """Block until every job has finished (or been aborted)."""
        await self._done.wait()

    # per-testcase queries

    async def progress(self, index: int) -> AsyncGenerator[StepType, None]:
        """
        Yield steps for a test case. Late callers replay every previous
        step first, then stream new ones. Multiple consumers are safe.
        """
        entry = self._get(index)
        cursor = 0

        while True:
            async with entry.condition:
                await entry.condition.wait_for(
                    lambda e=entry, c=cursor: c < len(e.steps) or e.completed
                )

            while cursor < len(entry.steps):
                yield entry.steps[cursor]
                cursor += 1

            if entry.completed:
                break

    def steps(self, index: int) -> list[StepType]:
        """Return accumulated steps so far (snapshot)."""
        return list(self._get(index).steps)

    async def result(self, index: int) -> TestRun:
        """Await and return the final TestRun for one test case."""
        return await self._get(index).job.result()

    # suite-wide queries

    def all_steps(self) -> dict[int, list[StepType]]:
        return {idx: list(e.steps) for idx, e in self._entries.items()}

    async def all_results(self) -> dict[int, TestRun]:
        await self._done.wait()
        return {
            idx: await entry.job.result()
            for idx, entry in self._entries.items()
        }

    #  Internal

    def _get(self, index: int) -> TestCaseEntry:
        try:
            return self._entries[index]
        except KeyError:
            raise KeyError(
                f"No entry for index={index}. "
                f"Valid indices: {list(self._entries)}"
            )

    async def _drain_job(self, entry: TestCaseEntry) -> None:
        """Sole consumer of the job's queue -> replayable buffer."""
        async for step in entry.job.progress():
            entry.steps.append(step)
            async with entry.condition:
                entry.condition.notify_all()

        entry.completed = True
        async with entry.condition:
            entry.condition.notify_all()

    async def _orchestrate(self) -> None:
        sem = asyncio.Semaphore(self._concurrency)

        async def _launch(entry: TestCaseEntry) -> None:
            async with sem:
                spec = entry.spec

                if spec.instruction is not None:
                    entry.job.start_natural(spec.instruction, spec.max_steps)

                else:
                    entry.job.start_executable(spec.executable_steps)

                await self._drain_job(entry)

        try:
            await asyncio.gather(
                *[_launch(entry) for entry in self._entries.values()],
                return_exceptions=True,
            )
        finally:
            self._done.set()