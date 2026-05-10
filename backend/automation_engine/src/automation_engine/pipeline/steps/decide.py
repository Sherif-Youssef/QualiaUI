import logging

from automation_engine.pipeline.context import IterationContext, IterationStatus
from automation_engine.planning import ModelState
from automation_engine.actions import TerminationSignal
from automation_engine.history import TestTermination, StateSnapshot
from automation_engine.serialization import PageRenderer, HistoryRenderer


logger = logging.getLogger(__name__)


class BuildModelStateStep:
    name = "build_model_state"

    def __init__(self):
        self._page_renderer = PageRenderer()
        self._history_renderer = HistoryRenderer()

    async def run(self, ctx: IterationContext) -> IterationContext:
        snapshot = ctx.snapshot

        ctx.model_state = ModelState(
            instruction=ctx.instruction,
            page=self._page_renderer.render(snapshot.state),
            history=self._history_renderer.render_history(ctx.test_run),
            screenshot=(
                snapshot.state.screenshot if snapshot.state else None
            ),
            last_error=ctx.last_error_message,
        )
        return ctx


class CallAgentStep:
    name = "call_agent"

    async def run(self, ctx: IterationContext) -> IterationContext:
        result = await ctx.planning_agent.run(ctx.model_state)
        ctx.llm_output = result

        if isinstance(result, TerminationSignal):
            logger.info(f"Termination: {result.termination_type}")
            ctx.status = IterationStatus.TERMINATE
            from automation_engine.pipeline.context import IterationResult
            ctx.results.append(
                IterationResult(termination=TestTermination(term_signal=result))
            )

        return ctx
