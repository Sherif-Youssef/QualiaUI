import logging

from automation_engine.pipeline.context import IterationContext, IterationStatus
from automation_engine.planning import ModelState
from automation_engine.actions import TerminationSignal
from automation_engine.testing.history import TestTermination

logger = logging.getLogger(__name__)


class BuildModelStateStep:
    name = "build_model_state"

    async def run(self, ctx: IterationContext) -> IterationContext:
        snapshot = ctx.snapshot

        ctx.model_state = ModelState(
            instruction=ctx.instruction,
            page=ctx.page_renderer.render(snapshot.state),
            history=ctx.history_renderer.render_history(ctx.test_run),
            screenshot=(
                snapshot.state.screenshot if ctx.use_screenshot else None
            ),
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
