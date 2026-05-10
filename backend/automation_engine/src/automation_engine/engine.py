from __future__ import annotations

import logging
from typing import AsyncGenerator, Any
from pathlib import Path

from automation_engine.compilation import ExecAction, ValidateExec
from automation_engine.compilation.variables import Variable, VariableStore
from automation_engine.execution.browser import PlaywrightBrowser
from automation_engine.planning import PlanningAgent, MiscAgent, ExtractSchemaSpec, create_model
from automation_engine.serialization import (
    PageRenderer,
    HistoryRenderer,
    get_js_serializer_path,
)
from automation_engine.pipeline.context import (
    CompiledAction,
    IterationContext,
    IterationStatus,
)
from automation_engine.pipeline.runner import IterationPipeline
from automation_engine.pipeline.steps import *
from automation_engine.config import EngineConfig
from automation_engine.history import (
    TestRun,
    TestStatus,
    TestStep,
    TestStepGroup,
    TestTermination,
    StateSnapshot,
)

logger = logging.getLogger(__name__)


class TestingEngine:
    """
    High-level API for browser automation via LLM.

    Usage:
        engine = TestingEngine(model="openai:gpt-4o")

        async with engine.launch("https://example.com") as session:
            async for step in session.run_group("Log in with admin / s3cret"):
                print(step.output.action_type, step.status)

        # Or run a single pre-compiled step:
        async with engine.launch("https://example.com") as session:
            step = await session.run_executable(exec_action)
    """
    
    def __init__(
        self,
        variables: list[Variable] | None = None,
        config: EngineConfig | None = None,
    ) -> None:
        self._config = config or EngineConfig()
        self._model = create_model(
            provider=self._config.llm.provider,
            model=self._config.llm.model,
            api_key=self._config.llm.api_key,
            base_url=self._config.llm.base_url,
            **self._config.llm.additional_kwargs
        )
        self._variables = variables or []

    @property
    def config(self) -> EngineConfig:
        return self._config

    def launch(
        self,
        url: str,
        variables: list[Variable] | None = None,
    ) -> TestingSession:
        session_variables = (variables or []) + self._variables
        return TestingSession(self, url=url, variables=session_variables)


class TestingSession:
    """
    A live browser session. Created via engine.launch(url).
    """

    def __init__(
        self,
        engine: TestingEngine,
        url: str,
        variables: list[Variable] | None = None,
    ) -> None:
        self._engine = engine
        self._url = url
        self._test_run: TestRun | None = None
        self._browser: PlaywrightBrowser | None = None
        self._planning_agent: PlanningAgent | None = None

        self._exec_pipeline = IterationPipeline(
            steps=[
                ResolveVariablesStep(variable_store=VariableStore(variables or [])),
                ExecuteActionsStep(),
            ],
            name="Execution Pipeline",
        )

        # Full LLM loop iteration
        self._loop_pipeline = IterationPipeline(
            steps=[
                ObserveStep(use_screenshot=self._engine.config.llm.use_screenshot),
                BuildModelStateStep(),
                CallAgentStep(),
                CompileActionsStep(),
                StuckDetectionStep(),
                self._exec_pipeline,
            ],
            max_consecutive_errors=3,
        )

    # Lifecycle

    async def __aenter__(self) -> TestingSession:
        cfg = self._engine.config
        self._browser = PlaywrightBrowser(
            headless=cfg.browser.headless,
            viewport_width=cfg.browser.viewport_width,
            viewport_height=cfg.browser.viewport_height,
        )
        await self._browser.start(
            self._url,
            init_scripts=[get_js_serializer_path()],
            record_video_dir=cfg.browser.record_video_dir,
        )

        self._test_run = TestRun(base_url=self._url)
        self._planning_agent = PlanningAgent(
            mode=cfg.llm.planning_mode,
            model=self._engine._model,
            use_tool_calling=cfg.llm.use_tool_calling,
        )
        self._misc_agents = MiscAgent(
            model=self._engine._model,
            use_tool_calling=cfg.llm.use_tool_calling,
        )

        logger.info(f"Session started: url={self._url}")
        return self

    async def __aexit__(self, *_) -> None:
        if self._browser:
            await self._browser.close()
            self._browser = None
        logger.info(
            f"Session closed (url={self._url}), "
            f"total steps: {len(self._test_run.all_steps)}, "
            f"failed steps: {len(self._test_run.failed_steps)}"
        )

    # History accessors

    @property
    def summary(self) -> TestRun:
        if not self._test_run.is_finalized:
            raise ValueError("Can't access test run before finalizing test")
        return self._test_run

    @property
    def group_summary(self) -> TestStepGroup:
        if not self._test_run.current_group.is_finalized:
            raise ValueError("Can't access group run before finalizing it")
        return self._test_run.current_group

    @property
    def all_steps(self) -> list[TestStep]:
        return self._test_run.all_steps

    @property
    def current_steps(self) -> list[TestStep]:
        return self._test_run.current_group.steps

    def finalize(self) -> TestRun:
        if (
            self._test_run.current_group
            and not self._test_run.current_group.is_finalized
        ):
            raise ValueError("Current group is not finalized")
        self._test_run.finalize()
        logger.info("Finalized run")
        return self._test_run

    async def get_video_path(self) -> str | None:
        if not self._engine.config.browser.record_video_dir:
            raise ValueError("Video recording not enabled for this session")
        if not self._test_run.is_finalized:
            raise ValueError("Test run must be finalized to get video path")
        return await str(self._browser.page.video.path()) if self._browser and self._browser.page.video else None  

    def finalize_group(self) -> TestStepGroup:
        if (
            not self._test_run.current_group
            or self._test_run.current_group.is_finalized
        ):
            raise ValueError("No non-finalized group found")
        self._test_run.current_group.finalize()
        logger.info(f"Finalized group: {self._test_run.current_group.index}")
        return self._test_run.current_group

    # Guards

    def _fail_fast(self) -> None:
        if self._test_run.status in (TestStatus.ERROR, TestStatus.FAILED):
            raise ValueError("Previous step(s) have failed, can't continue")

    def _assert_group(self, instruction: str = "") -> None:
        if (
            not self._test_run.current_group
            or self._test_run.current_group.is_finalized
        ):
            self._test_run.add_group(
                TestStepGroup(instruction=instruction, llm_loop=False)
            )
            logger.debug(f"Starting a new group: {instruction}")

    # LLM Loop

    async def run_loop(
        self, instruction: str, *, max_steps: int | None = None
    ) -> AsyncGenerator[TestStep | TestTermination, None]:
        self._fail_fast()

        if (
            self._test_run.current_group
            and not self._test_run.current_group.is_finalized
        ):
            raise ValueError("Current group isn't finalized")

        exe_cfg = self._engine.config.execution
        cap = min(
            max_steps or exe_cfg.max_steps,
            exe_cfg.max_steps - len(self._test_run.all_steps),
        )

        group = TestStepGroup(instruction=instruction, llm_loop=True)
        self._test_run.add_group(group)
        logger.info(f"LLM loop started: instruction={instruction} max_steps={cap}")

        while True:
            if len(group.steps) >= cap:
                logger.error("Exceeded max steps, aborting")
                group.finalize(
                    abort_reason="Exceeded max steps", 
                    final_snapshot=await self._extract_snapshot()
                )
                break

            ctx = self._build_context(instruction)
            ctx = await self._loop_pipeline.run_once(ctx)

            if ctx.error_message:
                raise RuntimeError(ctx.error_message)

            for result in ctx.results:
                if result.is_terminal:
                    group.finalize(
                        term=result.termination,
                        final_snapshot=await self._extract_snapshot()
                    )
                    yield result.termination
                else:
                    group.add_step(result.step)
                    yield result.step

            if group.is_finalized:
                break
            if group.status in (TestStatus.FAILED, TestStatus.ERROR):
                group.finalize(
                    abort_reason="Step failed",
                    final_snapshot=await self._extract_snapshot()
                )
                break

        logger.info(
            f"LLM loop finished: status={group.status}, "
            f"total steps: {len(group.steps)}"
            + (f" abort reason: {group.abort_reason}" if group.abort_reason else "")
        )

    # Direct Exec

    async def run_exec(self, raw_exec: ExecAction) -> TestStep:
        self._fail_fast()

        if (
            not self._test_run.current_group
            or self._test_run.current_group.is_finalized
        ):
            self._test_run.add_group(
                TestStepGroup(instruction="<executable>", llm_loop=False)
            )
            logger.debug("Starting a new executable group")

        # Seed context with pre-compiled action (no LLM action, no DOM index)
        ctx = self._build_context(instruction="<executable>")
        ctx.compiled_actions = [CompiledAction(raw_executable=raw_exec)]

        ctx = await self._exec_pipeline.run_once(ctx)

        # Extract the single result
        result = ctx.results[0] if ctx.results else None
        if result and result.step:
            self._test_run.current_group.add_step(result.step)
            return result.step

        # Fallback: pipeline errored before producing a result
        step = TestStep(executable=raw_exec)
        step.finalize(
            status=TestStatus.ERROR,
            error_message=ctx.error_message or "Exec pipeline produced no result",
        )
        self._test_run.current_group.add_step(step)
        return step

    # One-time APIs

    async def validate(self, assertion: str, context: str = "") -> TestStep:
        validate_exec = ValidateExec(assertion=assertion, context=context)
        return await self.run_exec(validate_exec)

    async def extract(self, description: str, schema: ExtractSchemaSpec, many: bool = False) -> Any:
        return await self._misc_agents.extract(
            self._browser.page, description=description, schema=schema, many=many,
        )

    # Helpers

    async def _extract_snapshot(self) -> StateSnapshot | None:
        try:
            return StateSnapshot(screenshot=await self._browser.screenshot())
        except Exception as e:
            logger.warning(f"Failed to capture snapshot: {e}")
            return None

    def _build_context(self, instruction: str) -> IterationContext:
        return IterationContext(
            instruction=instruction,
            browser=self._browser,
            planning_agent=self._planning_agent,
            misc_agent=self._misc_agents,
            test_run=self._test_run,
        )
