from __future__ import annotations

from typing import Literal

from .base import TerminationSignal
from .registry import termination
from .types import Termination


@termination
class Complete(TerminationSignal):
    """Task is FULLY done. ALL objectives achieved. Do NOT use if any steps remain."""
    action_type: Literal[Termination.COMPLETE] = Termination.COMPLETE


@termination
class Fail(TerminationSignal):
    """Task cannot be completed. Only use when original instruction CANNOT be fulfilled."""
    action_type: Literal[Termination.FAIL] = Termination.FAIL
