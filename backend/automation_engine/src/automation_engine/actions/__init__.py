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
    build_action_type, build_termination_type,
    parse_action, parse_termination,
    get_action_registry, get_termination_registry,
)

# Executable actions only (interactions + assertions)
ActionOutput = build_action_type()

# Termination signals only
TerminationOutput = build_termination_type()
