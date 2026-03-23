from __future__ import annotations

from datetime import datetime
from typing import Optional
from enum import StrEnum
from pydantic import BaseModel, Field, computed_field

from ..actions import Output
from ..actions.terminations import Complete, Fail
from ..actions.base import BaseAction, InteractionAction, AssertionAction, TerminationSignal
from ..compilation import ExecAction


class StepStatus(StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class RunStatus(StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    ABORTED = "aborted"


class TestStepSnapshot(BaseModel):
    """Snapshot of the browser state at the time of a TestStep."""
    screenshot: Optional[bytes] = Field(default=None, description="Screenshot of the page.")
    dom: Optional[str] = Field(default=None, description="Serialized DOM.")


class TestHierachyElement(BaseModel):
    started_at: datetime = Field(default_factory=datetime.now, init=False)
    finished_at: Optional[datetime] = Field(default=None, init=False)

    @computed_field
    @property
    def duration_seconds(self) -> float | None:
        if self.finished_at is None:
            return None
        return (self.finished_at - self.started_at).total_seconds()
    
    def finalize(self) -> None:
        self.finished_at = datetime.now()
    
    @property
    def is_finalized(self):
        return self.finished_at is not None


class TestStep(TestHierachyElement):
    index: Optional[int] = Field(default=None, description="0-based position relative to group.", init=False)
    run_index: Optional[int] = Field(default=None, description="0-based position relative to run.", init=False)
    output: Optional[Output] = Field(default=None, description="The action or termination signal the LLM produced.") # type: ignore
    executable: Optional[ExecAction] = Field(default=None, description="Executable action (compiled from LLM output).")
    status: Optional[StepStatus] = Field(default=None, init=False, description="Whether the step passed, failed, or was skipped.")
    error_message: Optional[str] = Field(default=None, description="Error message if the action failed.")
    snapshot_before: Optional[TestStepSnapshot] = Field(default=None, description="Browser state before executing the step.")
    snapshot_after: Optional[TestStepSnapshot] = Field(default=None, description="Browser state after executing the step.")

    @property
    def reasoning(self) -> str | None:
        if not self.output:
            return None
        if isinstance(self.output, BaseAction):
            return self.output.intent
        elif isinstance(self.output, TerminationSignal):
            return self.output.reason

    @property
    def is_termination(self) -> bool:
        return isinstance(self.output, TerminationSignal)

    @property
    def is_action(self) -> bool:
        return isinstance(self.output, BaseAction)

    @property
    def is_interaction(self) -> bool:
        return isinstance(self.output, InteractionAction)

    @property
    def is_assertion(self) -> bool:
        return isinstance(self.output, AssertionAction)

    def finalize(self, status: StepStatus = StepStatus.PASSED, error_message: str | None = None) -> None:
        super(TestStep, self).finalize()
        self.status = status
        self.error_message = error_message


class TestStepGroup(TestHierachyElement):
    instruction: Optional[str] = Field(default=None, description="Original natural-language, high-level task.")
    steps: list[TestStep] = Field(default_factory=list)

    @computed_field
    @property
    def status(self) -> RunStatus:
        if not self.steps:
            return RunStatus.ABORTED

        if any(s.status == StepStatus.ERROR for s in self.steps):
            return RunStatus.ERROR

        if any(s.status == StepStatus.FAILED for s in self.steps):
            return RunStatus.FAILED

        last = self.steps[-1]
        if last.is_termination:
            if isinstance(last.output, Fail):
                return RunStatus.FAILED
            if isinstance(last.output, Complete):
                return RunStatus.PASSED

        if all(s.status in (StepStatus.PASSED, StepStatus.SKIPPED) for s in self.steps):
            return RunStatus.PASSED

        return RunStatus.ABORTED


class TestRun(TestHierachyElement):
    """Complete history of a single test execution."""
    base_url: str
    groups: list[TestStepGroup] = Field(default_factory=list)

    def add_group(self, instruction: str | None = None) -> TestStepGroup:
        if self.current_group and not self.current_group.is_finalized:
            self.current_group.finalize()
        
        group = TestStepGroup(instruction=instruction)
        self.groups.append(group)
        return group

    def add_step(self, step: TestStep) -> TestStep:
        if not self.groups:
            raise ValueError("No step groups present, call `add_group()` first.")
        step.index = len(self.current_steps)
        step.run_index = len(self.all_steps)
        self.current_group.steps.append(step)
        return step

    def finalize(self) -> None:
        super(TestRun, self).finalize()
        if not self.current_group.is_finalized:
            self.current_group.finalize()

    @computed_field
    @property
    def status(self) -> None:
        steps = self.all_steps

        if not steps:
            return RunStatus.ABORTED

        if any(s.status == StepStatus.ERROR for s in steps):
            return RunStatus.ERROR
        if any(s.status == StepStatus.FAILED for s in steps):
            return RunStatus.FAILED

        last = steps[-1]
        if last.is_termination:
            if isinstance(last.output, Fail):
                return RunStatus.FAILED
            if isinstance(last.output, Complete):
                return RunStatus.PASSED

        if all(s.status in (StepStatus.PASSED, StepStatus.SKIPPED) for s in steps):
            return RunStatus.PASSED
        
        return RunStatus.ABORTED

    @property
    def current_group(self) -> TestStepGroup:
        if not self.groups:
            return None
        return self.groups[-1]

    @property
    def current_steps(self) -> list[TestStep]:
        return self.current_group.steps

    @computed_field
    @property
    def all_steps(self) -> list[TestStep]:
        return [s for g in self.groups for s in g.steps]

    @computed_field
    @property
    def failed_steps(self) -> list[TestStep]:
        return [s for s in self.all_steps if s.status in (StepStatus.FAILED, StepStatus.ERROR)]
