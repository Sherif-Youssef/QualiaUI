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

from automation_engine.actions import BaseAction, TerminationSignal
from automation_engine.testing.history import (
    TestStatus,
    TestRun,
    TestStepGroup,
    TestStep,
    StateSnapshot,
    TestTermination,
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
    TestingChain,
    PlanningOutput,
    build_chain,
    FullInputState,
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
        self._chain: TestingChain | None = None

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

    @staticmethod
    def __fail_fast(func):
        def wrapper(self: TestingSession, *args, **kwargs):
            if self._test_run.status in (TestStatus.ERROR, TestStatus.FAILED):
                raise ValueError("Previous step(s) have failed, can't continue")
            return func(self, *args, **kwargs)
        return wrapper

    # History

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
        self._test_run.finalize()
        logger.info("Finalized run")
        return self._test_run
    
    def finalize_group(self) -> TestStepGroup:
        if not self._test_run.current_group or self._test_run.current_group.is_finalized:
            raise ValueError("No non-finalized group found")
        self._test_run.current_group.finalize()
        logger.info(f"Finalized group: {self._test_run.current_group.index}")
        return self._test_run.current_group

    # Main API
    @__fail_fast
    async def run_loop(self, instruction: str, *, max_steps: int | None = None) -> AsyncGenerator[TestStep | TestTermination, None]:
        if self._test_run.current_group and not self._test_run.current_group.is_finalized:
            raise ValueError("Can't start a new group when the first one isn't finalized, call `finalize_group()` first")
        
        exe_cfg = self._engine.config.execution
        cap = min(max_steps or exe_cfg.max_steps, exe_cfg.max_steps - len(self._test_run.all_steps))

        group = TestStepGroup(instruction=instruction, llm_loop=True)
        self._test_run.add_group(group)
        logger.info(f"LLM loop started: instruction={instruction} max_steps={cap}")
        while True:
            if len(group.steps) >= cap:
                logger.error("Exceeded max steps, aborting")
                group.finalize(abort_reason="Exceeded max steps")
                break
            
            async for nxt in self.__run_next(instruction):
                if isinstance(nxt, TestTermination):
                    group.finalize(term=nxt)
                else:
                    group.add_step(nxt)
                
                yield nxt
            
            if group.is_finalized:
                break

            if group.status in (TestStatus.FAILED, TestStatus.ERROR):
                group.finalize(abort_reason=f"Step failed")
                break
        
        logger.info(
            f"LLM loop finished: status={group.status}, total steps: {len(group.steps)}"
            f" abort reason: {group.abort_reason}" if group.abort_reason else ""
        )

    @__fail_fast
    async def run_exec(self, exec_action: ExecAction) -> TestStep:
        if not self._test_run.current_group or self._test_run.current_group.is_finalized:
            self._test_run.add_group(TestStepGroup(instruction="<executable>", llm_loop=False))
            logger.debug("Starting a new executable group")
        step = await self.__run_exec(exec_action)
        self._test_run.current_group.add_step(step)
        return step

    @__fail_fast
    async def __run_next(self, instruction: str) -> AsyncGenerator[TestStep | TerminationSignal, None]:
        """Run a new loop iteration in the current group"""
        step = TestStep()

        # 1. Observe
        try:
            snapshot = await self.__observe()
        except Exception as e:
            logger.error(f"Failed to observe state: {e}", exc_info=True)
            step.finalize(status=TestStatus.ERROR, error_message=f"Failed to observe state: {e}")
            yield step
            return
        
        # 2. Decide
        try:
            llm_output = await self.__decide(instruction, snapshot)
        except Exception as e:
            logger.error(f"LLM call failed: {e}", exc_info=True)
            step.finalize(status=TestStatus.ERROR, error_message=f"LLM call failed: {e}")
            yield step
            return
        
        compiler = ActionCompiler(CompileContext(dom_index=snapshot.index, variables=self._engine._variable_store))

        # 3. Check for termination signal
        if isinstance(llm_output, TerminationSignal):
            logger.info(f"Termination: {llm_output.termination_type}")
            term = TestTermination(term_signal=llm_output)
            yield term
            return
        
        # Loop per output
        for action in llm_output:

            step = TestStep(action=action)
            
            # 4. Compile
            try:
                exec_action = compiler.compile(action, resolve_vars=False)
                # Storing non-resolved executable to be able to use it later in a different variable context
                step.executable = exec_action
                exec_action = compiler.resolve_vars(exec_action)
            except Exception as e:
                logger.error(f"Failed to compile LLM action: {e}", exc_info=True)
                step.finalize(status=TestStatus.ERROR, error_message=f"Failed to compile LLM action: {e}")
                yield step
                return
            
            step.snapshot_before = await self.__capture_snapshot()

            # 5. Execute
            try:
                await self._browser.execute(exec_action)
                logger.debug(f"Step passed: type={type(exec_action).__name__}")
                
            except (AssertionError, TimeoutError) as e:
                step.finalize(status=TestStatus.FAILED, error_message=str(e))
                logger.warning(f"Step failed: type={type(exec_action).__name__}")
                yield step
                return
            
            except Exception as e:
                step.finalize(status=TestStatus.ERROR, error_message=f"Error executing action: {e}")
                logger.error(f"Error executing action: {e}", exc_info=True)            
                yield step
                return
            
            step.snapshot_after = await self.__capture_snapshot()
            step.finalize(status=TestStatus.PASSED)
            yield step

    @__fail_fast
    async def __run_exec(self, raw_exec: ExecAction) -> TestStep:
        """Run a single executable action"""
        step = TestStep(snapshot_before=await self.__capture_snapshot(), executable=raw_exec)
        compiler = ActionCompiler(CompileContext(variables=self._engine._variable_store))

        # 1. Resolve
        try:
            exec_action = compiler.resolve_vars(raw_exec)
        except Exception as e:
            logger.error(f"Failed to resolve action: {e}", exc_info=True)
            step.finalize(status=TestStatus.ERROR, error_message=f"Failed to resolve action: {e}")
            return step

        # 2. Execute
        try:
            await self._browser.execute(exec_action)
            logger.debug(f"Step {step.index} in current group (executable) passed: type={type(exec_action).__name__}")
        except (AssertionError, TimeoutError) as e:
            step.finalize(status=TestStatus.FAILED, error_message=str(e))
            logger.warning(f"Step {step.index} in current group (executable) failed: type={type(exec_action).__name__}")
            return step
        except Exception as e:
            step.finalize(status=TestStatus.ERROR, error_message=f"Error executing action: {e}")
            logger.error(f"Error executing standalone action: {e}", exc_info=True)            
            return step
        
        step.finalize(status=TestStatus.PASSED, snapshot_after=await self.__capture_snapshot())
        return step

    @__fail_fast
    async def __observe(self) -> PageSnapshot:
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

        logger.debug(f"Snapshot: url={state.current_url} elements={len(index)} interactive={len(index.interactive_elements)}")

        return PageSnapshot(state=state, index=index)

    @__fail_fast
    async def __decide(self, instruction: str, snapshot: PageSnapshot) -> list[BaseAction] | TerminationSignal:
        """Ask the LLM for the next action(s)."""

        input_state = FullInputState(
            instruction=instruction,
            page=self._engine._dom_renderer.render_browser_state(snapshot.state),
            history=self._engine._history_renderer.render_history(self._test_run),
            screenshot=snapshot.state.screenshot if self._engine.config.llm.use_screenshot else None,
        )

        response = await self._chain.ainvoke(input_state)

        if not isinstance(response, PlanningOutput):
            raise TypeError(f"Unexpected response type: {type(response)}")
        output = response.output
        
        if isinstance(output, TerminationSignal):
            logger.info(f"LLM sent termination signal: {output.termination_type} - {response.reasoning}")
            return output
        
        if isinstance(output, BaseAction):
            actions = [output]
        elif isinstance(output, list):
            actions = output
        else:
            raise TypeError(f"Unexpected output type: {type(output)}")
        
        logger.info(f"LLM decided: ({len(actions)} actions(s)) - {response.reasoning}")

        return actions

    async def __capture_snapshot(self) -> StateSnapshot:
        screenshot = await self._browser.screenshot()
        return StateSnapshot(screenshot=screenshot)
