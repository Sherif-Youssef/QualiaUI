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

    def __init__(self, steps: Sequence[PipelineStep], propagate_status: bool = True, name: str = None) -> None:
        self._steps = steps
        self._propagate_status = propagate_status
        if name:
            self.name = name

    async def run_once(self, ctx: IterationContext) -> IterationContext:
        """Execute every step in order; stop early on non-CONTINUE status."""
        for step in self._steps:
            logger.debug(f"pipeline step: {step.name}")
            try:
                ctx = await step.run(ctx)
            except Exception as e:
                logger.exception(f"Unhandled error in step '{step.name}'", exc_info=True)
                ctx.status = IterationStatus.ERROR
                ctx.error = e
                ctx.error_message = f"Step '{step.name}' failed: {e}"
                break

            if ctx.status != IterationStatus.CONTINUE:
                logger.debug(f"Pipeline {self.name} interrupted at '{step.name}': {ctx.status.name}")
                break

        return ctx

    async def run(self, ctx: IterationContext) -> IterationContext:
        ctx = await self.run_once(ctx)
        if not self._propagate_status:
            ctx.status = IterationStatus.CONTINUE
        return ctx
