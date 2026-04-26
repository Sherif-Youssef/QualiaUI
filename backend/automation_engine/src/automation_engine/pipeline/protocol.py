from __future__ import annotations

from typing import Protocol, runtime_checkable

from automation_engine.pipeline.context import IterationContext


@runtime_checkable
class PipelineStep(Protocol):
    name: str

    async def run(self, ctx: IterationContext) -> IterationContext: ...
