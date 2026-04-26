import logging

from automation_engine.pipeline.context import (
    IterationContext,
    IterationResult,
    IterationStatus,
)
from automation_engine.history import TestStep, TestStatus, StateSnapshot

logger = logging.getLogger(__name__)


class ExecuteActionsStep:
    name = "execute_actions"

    async def run(self, ctx: IterationContext) -> IterationContext:
        if ctx.status != IterationStatus.CONTINUE:
            return ctx

        for compiled in ctx.compiled_actions:
            step = TestStep(action=compiled.action)
            step.executable = compiled.raw_executable

            step.snapshot_before = await self._capture(ctx)

            try:
                await ctx.browser.execute(compiled.resolved_executable)
                logger.debug(
                    f"Step passed: type={type(compiled.resolved_executable).__name__}"
                )
            except (AssertionError, TimeoutError) as e:
                step.finalize(status=TestStatus.FAILED, error_message=str(e))
                logger.warning(
                    f"Step failed: type={type(compiled.resolved_executable).__name__}"
                )
                ctx.results.append(IterationResult(step=step))
                ctx.status = IterationStatus.FAILED
                return ctx
            except Exception as e:
                step.finalize(
                    status=TestStatus.ERROR,
                    error_message=f"Error executing action: {e}",
                )
                logger.error(f"Error executing action: {e}", exc_info=True)
                ctx.results.append(IterationResult(step=step))
                ctx.status = IterationStatus.ERROR
                ctx.error = e
                return ctx

            step.snapshot_after = await self._capture(ctx)
            step.finalize(status=TestStatus.PASSED)
            ctx.results.append(IterationResult(step=step))

        return ctx

    @staticmethod
    async def _capture(ctx: IterationContext) -> StateSnapshot:
        screenshot = await ctx.browser.screenshot()
        return StateSnapshot(screenshot=screenshot)
