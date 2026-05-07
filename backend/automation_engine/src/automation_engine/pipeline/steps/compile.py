import logging

from automation_engine.compilation import ActionCompiler, CompileContext
from automation_engine.pipeline.context import (
    IterationContext,
    IterationResult,
    IterationStatus,
    CompiledAction,
)
from automation_engine.history import TestStep, TestStatus
from automation_engine.actions import InteractionAction

logger = logging.getLogger(__name__)


class CompileActionsStep:
    name = "compile_actions"

    async def run(self, ctx: IterationContext) -> IterationContext:
        if ctx.status != IterationStatus.CONTINUE:
            return ctx

        compiler = ActionCompiler(
            CompileContext(
                dom_index=ctx.snapshot.index,
                variables=ctx.variable_store,
            )
        )

        compiled: list[CompiledAction] = []

        for action in ctx.llm_output:
            if not isinstance(action, InteractionAction):
                continue
            try:
                raw_exec = compiler.compile(action, resolve_vars=False)
            except Exception as e:
                logger.error(f"Failed to compile action: {e}", exc_info=True)
                step = TestStep(action=action)
                step.finalize(
                    status=TestStatus.ERROR,
                    error_message=f"Failed to compile LLM action: {e}",
                )
                ctx.results.append(IterationResult(step=step))
                ctx.status = IterationStatus.ERROR
                ctx.error = e
                return ctx

            compiled.append(CompiledAction(action=action, raw_executable=raw_exec))

        ctx.compiled_actions = compiled
        logger.debug(f"Compiled {len(compiled)} action(s) successfully")
        return ctx


class ResolveVariablesStep:
    name = "resolve_variables"

    async def run(self, ctx: IterationContext) -> IterationContext:
        if ctx.status != IterationStatus.CONTINUE:
            return ctx

        if len(ctx.variable_store) == 0:
            for compiled in ctx.compiled_actions:
                compiled.resolved_executable = compiled.raw_executable
            logger.debug("No variables to resolve, skipping variable resolution step")
            return ctx

        compiler = ActionCompiler(CompileContext(variables=ctx.variable_store))

        for compiled in ctx.compiled_actions:
            try:
                compiled.resolved_executable = compiler.resolve_vars(compiled.raw_executable)
            except Exception as e:
                logger.error(f"Failed to resolve variables: {e}", exc_info=True)
                step = TestStep(action=compiled.action)
                step.executable = compiled.raw_executable
                step.finalize(
                    status=TestStatus.ERROR,
                    error_message=f"Failed to resolve variables: {e}",
                )
                ctx.results.append(IterationResult(step=step))
                ctx.status = IterationStatus.ERROR
                ctx.error = e
                return ctx

        logger.debug(f"Resolved variables for {len(ctx.compiled_actions)} action(s)")
        return ctx
