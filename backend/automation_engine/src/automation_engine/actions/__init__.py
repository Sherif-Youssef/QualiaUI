from .types import (
    Interaction, Assertion, Termination,
)
from .base import (
    BaseAction, InteractionAction, AssertionAction,
    TerminationSignal,
)
from .interactions import *
from .assertions import *
from .terminations import *
from .registry import (
    action, termination,
    build_action_type, build_output_type,
    parse_action, parse_output,
    get_registry,
)

# Executable actions only (interactions + assertions)
Action = build_action_type()

# Anything the LLM can emit (actions + termination signals)
Output = build_output_type()
