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

    def __init__(self, steps: Sequence[PipelineStep]) -> None:
        self._steps = steps

    async def run_once(self, ctx: IterationContext) -> IterationContext:
        """Execute every step in order; stop early on non-CONTINUE status."""
        for step in self._steps:
            logger.debug(f"pipeline step: {step.name}")
            try:
                ctx = await step.run(ctx)
            except Exception as e:
                logger.exception(f"Unhandled error in step '{step.name}'")
                ctx.status = IterationStatus.ERROR
                ctx.error = e
                ctx.error_message = f"Step '{step.name}' failed: {e}"
                break

            if ctx.status != IterationStatus.CONTINUE:
                logger.debug(f"Pipeline interrupted at '{step.name}': {ctx.status.name}")
                break

        return ctx
