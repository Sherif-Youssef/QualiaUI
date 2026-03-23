"""
Main orchestrator. Ties together:
  - PlaywrightBrowser (interface + execution)
  - ActionCompiler (action → exec mapping)
  - LangChain chains (LLM)
  - State extraction
  - History tracking
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.runnables import Runnable

from automation_engine.actions import (
    BaseAction,
    TerminationSignal,
    Complete,
    Fail,
)
from automation_engine.testing.history import (
    TestRun,
    TestStep,
    TestStepGroup,
    TestStepSnapshot,
    StepStatus,
    RunStatus,
)
from automation_engine.serialization import (
    HistoryRenderer,
    DOMRenderer,
    get_js_serializer_path,
    get_js_serializer_api_code,
)
from automation_engine.planning import (
    BrowserState,
    DOMElement,
    DOMIndex,
    PageSnapshot,
    StepResponse,
    ActionGroupResponse,
    build_chain,
)
from automation_engine.execution.browser import PlaywrightBrowser
from automation_engine.compilation import ActionCompiler, CompileContext, ExecAction
from automation_engine.testing.config import EngineConfig
from automation_engine.compilation.variables import Variable, VariableStore


logger = logging.getLogger(__name__)


class TestingEngine:
    """
    High-level API for browser automation via LLM.

    Usage:
        engine = TestingEngine(llm=ChatOpenAI(model="gpt-4o"))

        async with engine.launch("https://example.com") as session:
            async for step in session.run_group("Log in with admin / s3cret"):
                print(step.output.action_type, step.status)

        # Or run a single pre-compiled step:
        async with engine.launch("https://example.com") as session:
            step = await session.run_executable(exec_action)
    """

    def __init__(
        self,
        llm: BaseChatModel,
        variables: list[Variable] | None = None,
        config: EngineConfig | None = None,
    ) -> None:
        self._llm = llm
        self._config = config or EngineConfig()
        self._variable_store = VariableStore(variables)

        self._dom_renderer = DOMRenderer(self._config.renderer.dom)
        self._history_renderer = HistoryRenderer(self._config.renderer.history)

    @property
    def config(self) -> EngineConfig:
        return self._config

    def launch(self, url: str) -> TestingSession:
        """Create a session bound to a URL. Use as async context manager."""
        return TestingSession(self, url)


class TestingSession:
    """
    A live browser session. Created via engine.launch(url).
    Manages browser lifecycle and exposes run methods.
    """

    def __init__(self, engine: TestingEngine, url: str) -> None:
        self._engine = engine
        self._url = url
        self._test_run: TestRun | None = None
        self._browser: PlaywrightBrowser | None = None
        self._chain: Runnable | None = None

    async def __aenter__(self) -> TestingSession:
        cfg = self._engine.config

        self._browser = PlaywrightBrowser(
            headless=cfg.browser.headless,
            viewport_width=cfg.browser.viewport_width,
            viewport_height=cfg.browser.viewport_height,
        )
        await self._browser.start(
            url=self._url,
            init_scripts=[get_js_serializer_path()],
        )
        self._test_run = TestRun(base_url=self._url)

        self._chain = build_chain(
            self._engine._llm,
            system_prompt=cfg.llm.system_prompt,
            tooling=cfg.llm.use_tool_calling,
            allow_grouped_steps=cfg.llm.allow_grouped_steps,
        )

        logger.info("Session started: url=%s", self._url)
        return self

    async def __aexit__(self, *_) -> None:
        if self._browser:
            await self._browser.close()
            self._browser = None
        logger.info("Session closed.")

    @staticmethod
    def _fail_fast(func):
        def wrapper(self: TestingSession, *args, **kwargs):
            if self._test_run.status in (RunStatus.ERROR, RunStatus.FAILED):
                raise ValueError("Previous step(s) have failed, can't continue")
            return func(self, *args, **kwargs)
        return wrapper

    @property
    def test_run(self) -> TestRun:
        if self._test_run.is_finalized:
            self._test_run.finalize()
        return self._test_run
    
    @property
    def current_group(self) -> TestStepGroup:
        if not self._test_run.current_group.is_finalized:
            self.finalize_group()
        return self._test_run.current_group

    @property
    def steps(self) -> list[TestStep]:
        return self._test_run.all_steps
    
    @property
    def current_steps(self) -> list[TestStep]:
        return self._test_run.current_steps

    def finalize_group(self) -> None:
        if self._test_run.current_group.is_finalized:
            return
        if self._test_run.current_group.status not in (RunStatus.ERROR, RunStatus.FAILED):
            self._test_run.add_step(TestStep(output=Complete(reason="<manual_no_errors>")))
        else:
            self._test_run.add_step(TestStep(output=Fail(reason="<manual_errors_present>")))
        self._test_run.current_group.finalize()

    # Public APIs

    @_fail_fast
    async def run_group(
        self,
        instruction: str,
        *,
        max_steps: int | None = None,
    ) -> AsyncGenerator[TestStep, None]:
        """
        Run a full LLM-driven group of steps for the given instruction.
        Yields each TestStep as it completes.
        """
        exe = self._engine.config.execution

        if self._test_run.current_group and not self._test_run.current_group.is_finalized:
            self._test_run.current_group.finalize()

        cap = min(max_steps or exe.max_steps, exe.max_steps - len(self._test_run.all_steps))
        consecutive_errors = 0

        group = self._test_run.add_group(instruction)

        logger.info("Group started: instruction=%r max_steps=%d", instruction, cap)

        for _ in range(cap):
            if group.is_finalized:
                break

            if consecutive_errors >= exe.max_errors:
                logger.error(
                    "Max consecutive errors reached (%d). Aborting group.",
                    consecutive_errors,
                )
                break

            # Observe
            try:
                snapshot = await self._observe()
            except Exception as e:
                logger.error("State extraction failed: %s", e, exc_info=True)
                break

            # Decide
            try:
                outputs = await self._decide(instruction, snapshot)
            except Exception as e:
                logger.error("LLM call failed: %s", e, exc_info=True)
                consecutive_errors += 1
                continue

            # Compile & Execute
            compiler = ActionCompiler(
                CompileContext(dom_index=snapshot.index, variables=self._engine._variable_store)
            )
            should_break = False

            for output in outputs:
                step = await self._compile_execute_single(output, compiler)
                yield step

                if step.status == StepStatus.PASSED:
                    consecutive_errors = 0
                else:
                    consecutive_errors += 1
                    logger.warning(
                        "Step %d %s: %s",
                        step.run_index,
                        step.status,
                        step.error_message,
                    )

                if step.is_termination or step.status in (StepStatus.FAILED, StepStatus.ERROR):
                    should_break = True
                    break

            if should_break:
                break

        group.finalize()

        logger.info(
            "Group finished: status=%s steps=%d",
            group.status,
            len(group.steps),
        )

    @_fail_fast
    async def run_step(
        self,
        instruction: str,
    ) -> TestStep:
        async for step in self.run_group(instruction, max_steps=1):
            return step

    @_fail_fast
    async def run_executable(
        self,
        exec_action: ExecAction,
    ) -> TestStep:
        """Execute a single pre-compiled ExecAction against the browser."""
        if not self._test_run.current_group or self._test_run.current_group.is_finalized:
            self._test_run.add_group("<executable>")

        step = self._test_run.add_step(
            TestStep(
                executable=exec_action,
                snapshot_before=await self._capture_step_snapshot()
            ),
        )
        compiler = ActionCompiler(CompileContext(variables=self._engine._variable_store))

        await self._execute_single(exec_action, compiler, step)
        return step

    # Internal

    async def _observe(self) -> PageSnapshot:
        """Capture page state."""
        await self._browser.wait_for_load_state("domcontentloaded")

        raw: dict = await self._browser.evaluate_js(code=get_js_serializer_api_code())
        root = DOMElement(**raw)
        index = DOMIndex(root)

        state = BrowserState(
            current_url=self._browser.url,
            page_title=await self._browser.title(),
            viewport_width=self._browser.viewport_width,
            viewport_height=self._browser.viewport_height,
            root=root,
            screenshot=(
                await self._browser.screenshot()
                if self._engine.config.llm.use_screenshot
                else None
            ),
        )

        logger.debug(
            "Snapshot: url=%s elements=%d interactive=%d",
            state.current_url,
            len(index),
            len(index.interactive_elements),
        )

        return PageSnapshot(state=state, index=index)

    async def _decide(
        self,
        instruction: str,
        snapshot: PageSnapshot,
    ) -> list[BaseAction | TerminationSignal]:
        """Ask the LLM for the next action(s)."""

        invoke_input: dict = {
            "instruction": instruction,
            "page": self._engine._dom_renderer.render_browser_state(snapshot.state),
            "history": self._engine._history_renderer.render_history(self._test_run),
        }

        if self._engine.config.llm.use_screenshot:
            invoke_input["screenshot"] = snapshot.state.screenshot

        response = await self._chain.ainvoke(invoke_input)

        if isinstance(response, StepResponse):
            outputs = [response.output]
            thought = response.reasoning
        elif isinstance(response, ActionGroupResponse):
            outputs = response.output
            thought = response.reasoning
        else:
            raise TypeError(f"Unexpected response type: {type(response)}")

        logger.info(
            "LLM decided: %s (%d output(s)) - %s",
            outputs[0].action_type if outputs else "empty",
            len(outputs),
            thought if thought else "",
        )

        return outputs

    async def _capture_step_snapshot(self) -> TestStepSnapshot:
        """Lightweight snapshot for step before/after."""
        screenshot = await self._browser.screenshot()
        return TestStepSnapshot(screenshot=screenshot)

    async def _execute_single(
        self,
        exec_action: ExecAction,
        compiler: ActionCompiler,
        step: TestStep
    ) -> None:
        
        try:
            resolved_action = compiler.resolve_vars(exec_action)
        except Exception as e:
            step.finalize(status=StepStatus.ERROR, error_message=f"Error resolving variables: {e}")
            return

        try:
            await self._browser.execute(resolved_action)
            step.finalize(status=StepStatus.PASSED)
            logger.debug("Step %d passed: %s", step.run_index, type(resolved_action).__name__)
        except (AssertionError, TimeoutError) as e:
            step.finalize(status=StepStatus.FAILED, error_message=str(e))
        except Exception as e:
            step.finalize(status=StepStatus.ERROR, error_message=str(e))
        
        step.snapshot_after = await self._capture_step_snapshot()

    async def _compile_execute_single(
        self,
        output: BaseAction | TerminationSignal,
        compiler: ActionCompiler,
    ) -> TestStep:
        """Compile an LLM output to an ExecAction, execute it, record as a TestStep."""
        snapshot_before = await self._capture_step_snapshot()
        step = self._test_run.add_step(
            TestStep(output=output, snapshot_before=snapshot_before),
        )

        # Termination signals don't need compilation or execution
        if isinstance(output, TerminationSignal):
            step.finalize(status=StepStatus.PASSED)
            logger.info("Termination: %s", output.action_type)
            return step

        # Compile
        try:
            exec_action = compiler.compile(output, resolve_vars=False)
            step.executable = exec_action
        except Exception as e:
            step.finalize(status=StepStatus.ERROR, error_message=f"Compilation failed: {e}")
            step.snapshot_after = await self._capture_step_snapshot()
            return step

        # Execute
        await self._execute_single(exec_action, compiler, step)

        return step
