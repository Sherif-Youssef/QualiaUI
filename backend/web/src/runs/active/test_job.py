import asyncio
from typing import AsyncGenerator, Optional, Union, Coroutine

from automation_engine import TestingEngine, TestStep, TestTermination, ExecAction, TestRun, TestStatus

StepType = Union["TestStep", "TestTermination"]


class TestJob:
    def __init__(self, engine: TestingEngine, url: str):
        self._engine = engine
        self._url = url

        self._task: Optional[asyncio.Task] = None
        self._queue: asyncio.Queue = asyncio.Queue()

        self._steps: list[StepType] = []
        self._final_run: Optional["TestRun"] = None

        self._done = asyncio.Event()

    # Public API

    def start_natural(self, instruction: str, max_steps: int | None = None):
        self._start(self._run_natural(instruction, max_steps))

    def start_executable(self, exec_actions: list[ExecAction]):
        self._start(self._run_executables(exec_actions))

    def abort(self):
        if self._task:
            self._task.cancel()

    async def progress(self) -> AsyncGenerator[StepType, None]:
        # If already drained, don't block
        if self._done.is_set() and self._queue.empty():
            return

        while True:
            item = await self._queue.get()
            if item is None:
                break
            yield item


    @property
    def steps(self) -> list[StepType]:
        return self._steps

    async def result(self) -> TestRun:
        await self._done.wait()
        return self._final_run

    # Internal

    def _start(self, coro: Coroutine):
        if self._task:
            raise RuntimeError("Job already started")
        self._task = asyncio.create_task(coro)

    async def _run_natural(self, instruction: str, max_steps: int | None):
        try:
            async with self._engine.launch(self._url) as session:
                async for step in session.run_loop(instruction, max_steps=max_steps):
                    self._steps.append(step)
                    await self._queue.put(step)

                session.finalize()
                self._final_run = session.summary

        except asyncio.CancelledError:
            await self._queue.put(self._abort_event())
            raise

        finally:
            await self._queue.put(None)
            self._done.set()

    async def _run_executables(self, exec_actions: list[ExecAction]):
        try:
            async with self._engine.launch(self._url) as session:

                for action in exec_actions:
                    # cancellation point before each step
                    await asyncio.sleep(0)

                    step = await session.run_exec(action)

                    self._steps.append(step)
                    await self._queue.put(step)

                    # stop on failure
                    if step.status != TestStatus.PASSED:
                        break
                
                session.finalize_group()
                session.finalize()
                self._final_run = session.summary

        except asyncio.CancelledError:
            await self._queue.put(self._abort_event())
            raise

        finally:
            await self._queue.put(None)
            self._done.set()

    def _abort_event(self):
        return {"type": "aborted"}
