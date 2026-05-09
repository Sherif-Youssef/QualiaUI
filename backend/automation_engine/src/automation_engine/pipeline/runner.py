from __future__ import annotations

import logging
from typing import Sequence

from automation_engine.pipeline.context import IterationContext, IterationStatus
from automation_engine.pipeline.protocol import PipelineStep

logger = logging.getLogger(__name__)


class IterationPipeline:
    """
    Runs an ordered sequence of steps against an IterationContext.
    """
    name = "general_pipeline"

    def __init__(
        self,
        steps: Sequence[PipelineStep],
        propagate_status: bool = True,
        name: str = None,
        max_consecutive_errors: int = 0
    ) -> None:
        self._steps = steps
        self._propagate_status = propagate_status
        if name:
            self.name = name
        self.max_consecutive_errors = max_consecutive_errors
        self._restart_requested = False

    def restart(self) -> None:
        """Signal the pipeline to start over from the first step."""
        self._restart_requested = True

    async def run_once(self, ctx: IterationContext) -> IterationContext:
        """Execute every step in order; stop early on non-CONTINUE status."""
        step_index = 0
        consecutive_errors = 0
        self._restart_requested = False
        ctx.last_error_message = ""

        while step_index < len(self._steps):
            if self._restart_requested:
                logger.debug(f"Pipeline {self.name} restarting from the beginning")
                step_index = 0
                self._restart_requested = False
                continue

            step = self._steps[step_index]
            logger.debug(f"pipeline step: {step.name}")
            try:
                ctx = await step.run(ctx)
            except Exception as e:
                logger.exception(f"Unhandled error in step '{step.name}'", exc_info=True)
                ctx.status = IterationStatus.ERROR
                ctx.error = e
                ctx.error_message = f"Step '{step.name}' failed: {e}"

            if ctx.status in (IterationStatus.ERROR, IterationStatus.FAILED):
                consecutive_errors += 1
                if consecutive_errors <= self.max_consecutive_errors:
                    logger.debug(
                        f"Pipeline {self.name} encountered an error at '{step.name}', "
                        f"retrying from start ({consecutive_errors}/{self.max_consecutive_errors})"
                    )
                    ctx.status = IterationStatus.CONTINUE
                    ctx.last_error_message = ctx.error_message
                    ctx.error = None
                    ctx.error_message = ""
                    self.restart()
                    continue
                else:
                    logger.debug(f"Pipeline {self.name} max consecutive errors reached at '{step.name}'")
                    break

            if ctx.status != IterationStatus.CONTINUE:
                logger.debug(f"Pipeline {self.name} interrupted at '{step.name}': {ctx.status.name}")
                break

            consecutive_errors = 0
            step_index += 1

        return ctx

    async def run(self, ctx: IterationContext) -> IterationContext:
        ctx = await self.run_once(ctx)
        if not self._propagate_status:
            ctx.status = IterationStatus.CONTINUE
        return ctx
