from __future__ import annotations

from typing import Annotated, Literal, Optional

from .base import ExecAction
from .registry import maps
from automation_engine.compilation.markers import TextResolvable
from automation_engine.actions.misc import *


@maps(Validate)
class ValidateExec(ExecAction):
    action_type: Literal[Misc.VALIDATE] = Misc.VALIDATE

    assertion: Annotated[str, TextResolvable()]
    context: Annotated[Optional[str], TextResolvable()]
