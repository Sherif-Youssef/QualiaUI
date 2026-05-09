from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from automation_engine.actions import BaseAction, TerminationSignal
    from automation_engine.compilation import ExecAction
    from automation_engine.execution.browser import PlaywrightBrowser
    from automation_engine.planning import PageSnapshot, PlanningAgent, ModelState, MiscAgent
    from automation_engine.serialization import PageRenderer, HistoryRenderer
    from automation_engine.compilation.variables import VariableStore
    from automation_engine.history import TestRun, TestStep, TestTermination


class IterationStatus(Enum):
    CONTINUE = auto()
    TERMINATE = auto()
    FAILED = auto()
    ERROR = auto()


@dataclass
class CompiledAction:
    action: BaseAction | None = None               # LLM action
    raw_executable: ExecAction | None = None       # before variable resolution
    resolved_executable: ExecAction | None = None  # after variable resolution


@dataclass
class IterationResult:
    step: TestStep | None = None
    termination: TestTermination | None = None

    @property
    def is_terminal(self) -> bool:
        return self.termination is not None


@dataclass
class IterationContext:
    # Inputs
    instruction: str = ""
    browser: PlaywrightBrowser | None = None
    planning_agent: PlanningAgent | None = None
    misc_agent: MiscAgent | None = None
    test_run: TestRun | None = None

    # Per-iteration state
    snapshot: PageSnapshot | None = None
    model_state: ModelState | None = None
    llm_output: list[BaseAction] | TerminationSignal | None = None
    compiled_actions: list[CompiledAction] = field(default_factory=list)
    results: list[IterationResult] = field(default_factory=list)

    # Control flow
    status: IterationStatus = IterationStatus.CONTINUE
    error: Exception | None = None
    error_message: str = ""
    last_error_message: str = ""
