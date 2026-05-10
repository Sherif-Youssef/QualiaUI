from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from enum import StrEnum
from pydantic import BaseModel, Field, computed_field

from automation_engine.actions import Complete, Fail, BaseAction, TerminationSignal
from automation_engine.compilation import ExecAction


class TestStatus(StrEnum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    ERROR = "ERROR"
    ABORTED = "ABORTED"


class StateSnapshot(BaseModel):
    """Snapshot of the browser state at the time of a TestStep."""
    screenshot: bytes = Field(default=None, description="Screenshot of the page.")


class TestHierarchyElement(BaseModel):
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), init=False)
    finished_at: Optional[datetime] = Field(default=None, init=False)

    def _assert_running(self):
        if self.is_finalized:
            raise ValueError(f"Test element ({self.__class__.__name__}) is already finalized")
    
    def _assert_finalized(self):
        if not self.is_finalized:
            raise ValueError(f"Test element ({self.__class__.__name__}) isn't finalized yet, call `finalize()`")

    def finalize(self) -> None:
        self._assert_running()
        self.finished_at = datetime.now(timezone.utc)

    @computed_field
    @property
    def duration_seconds(self) -> float | None:
        if self.finished_at is None:
            return None
        return (self.finished_at - self.started_at).total_seconds()

    @property
    def is_finalized(self):
        return self.finished_at is not None


class TestStep(TestHierarchyElement):
    index: Optional[int] = Field(default=None, description="0-based position relative to group.")
    action: Optional[BaseAction] = Field(default=None, description="LLM Action")
    executable: Optional[ExecAction] = Field(default=None, description="Executable action (compiled from LLM output).")
    status: Optional[TestStatus] = Field(default=None, description="Whether the step passed, failed, or was skipped.")
    error_message: Optional[str] = Field(default=None, description="Error message if the action failed.")
    snapshot_before: Optional[StateSnapshot] = Field(default=None, description="Browser state before executing the step.")
    snapshot_after: Optional[StateSnapshot] = Field(default=None, description="Browser state after executing the step.")

    def set_exe(self, exe_action: ExecAction) -> None:
        self.executable = exe_action

    def finalize(
        self,
        status: TestStatus,
        error_message: str | None = None,
    ) -> None:
        super(TestStep, self).finalize()
        self.status = status
        self.error_message = error_message

    @property
    def is_success(self) -> bool:
        return self.status == TestStatus.PASSED
    
    @computed_field
    @property
    def termination_reason(self) -> str | None:
        if self.status in (TestStatus.FAILED, TestStatus.ERROR):
            return self.error_message
        else:
            return None


class TestTermination(BaseModel):
    term_signal: TerminationSignal


class TestStepGroup(TestHierarchyElement):
    index: Optional[int] = Field(default=None, description="0-based position relative to run.", init=False)
    instruction: Optional[str] = Field(default=None, description="Original natural-language, high-level task.")
    steps: list[TestStep] = Field(default_factory=list, init=False)
    # NOTE: When true, need a termination signal from LLM, otherwise, marked as ABORTED
    llm_loop: bool = Field(default=True)
    term: Optional[TestTermination] = Field(default=None, init=False)
    abort_reason: Optional[str] = Field(default=None)
    final_snapshot: Optional[StateSnapshot] = Field(default=None, description="Browser state at the end of the group.")

    def add_step(self, step: TestStep) -> None:
        self._assert_running()
        step.index = len(self.steps)
        self.steps.append(step)

    def finalize(
        self,
        term: TestTermination | None = None,
        abort_reason: str | None = None,
        final_snapshot: StateSnapshot | None = None,
    ) -> None:
        super(TestStepGroup, self).finalize()
        self.term = term
        self.abort_reason = abort_reason
        self.final_snapshot = final_snapshot
        
    @computed_field
    @property
    def status(self) -> TestStatus:
        for nxt in (TestStatus.ERROR, TestStatus.FAILED, TestStatus.ABORTED):
            if any(s.status == nxt for s in self.steps):
                return nxt
        
        if not self.llm_loop:
            # No need for a termination signal
            return TestStatus.PASSED

        if self.term is None:
            return TestStatus.ABORTED
        elif isinstance(self.term.term_signal, Fail):
            return TestStatus.FAILED
        else:
            return TestStatus.PASSED

    @computed_field
    @property
    def termination_reason(self) -> str | None:
        if self.term is not None:
            return self.term.term_signal.reason
        if self.status in (TestStatus.FAILED, TestStatus.ERROR):
            return self.steps[-1].termination_reason
        elif self.status == TestStatus.ABORTED:
            return self.abort_reason
        else:
            return None

    @property
    def failed_steps(self) -> list[TestStep]:
        return [s for s in self.steps if s.status in (TestStatus.FAILED, TestStatus.ERROR)]


class TestRun(TestHierarchyElement):
    """Complete history of a single test execution."""
    base_url: str
    groups: list[TestStepGroup] = Field(default_factory=list, init=False)

    def add_group(self, group: TestStepGroup) -> None:
        self._assert_running()
        if self.current_group:
            self.current_group._assert_finalized()
        group.index = len(self.groups)
        self.groups.append(group)

    def finalize(self) -> None:
        if self.current_group:
            self.current_group._assert_finalized()
        super(TestRun, self).finalize()

    @computed_field
    @property
    def status(self) -> TestStatus:
        for nxt in (TestStatus.ERROR, TestStatus.FAILED, TestStatus.ABORTED):
            if any(g.status == nxt for g in self.groups):
                return nxt
        
        return TestStatus.PASSED

    @computed_field
    @property
    def termination_reason(self) -> str | None:
        return self.groups[-1].termination_reason if self.groups else None

    @property
    def current_group(self) -> TestStepGroup | None:
        if not self.groups:
            return None
        return self.groups[-1]

    @property
    def all_steps(self) -> list[TestStep]:
        return [s for g in self.groups for s in g.steps]

    @property
    def failed_steps(self) -> list[TestStep]:
        return [s for s in self.all_steps if s.status in (TestStatus.FAILED, TestStatus.ERROR)]
