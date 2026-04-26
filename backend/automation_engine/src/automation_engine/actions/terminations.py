from __future__ import annotations

from typing import Literal

from .base import TerminationSignal
from .types import Termination


class Complete(TerminationSignal):
    """Task is FULLY done. ALL objectives achieved. Do NOT use if any steps remain."""
    termination_type: Literal[Termination.COMPLETE] = Termination.COMPLETE


class Fail(TerminationSignal):
    """Task cannot be completed. Only use when original instruction CANNOT be fulfilled."""
    termination_type: Literal[Termination.FAIL] = Termination.FAIL
