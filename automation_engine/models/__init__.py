from typing import Union

from .agent_history import (
    AgentHistory,
)

from .base_action import (
    ACTION,
    Action,
)

from .termination import (
    TERMINATION,
    TerminationAction,
    CompletedTerminationAction,
    FailedTerminationAction
)

from .interaction import (
    INTERACTION,
    InteractionAction,
    ClickInteractionAction, 
    InputInteractionAction, 
    DragInteractionAction, 
    HoverInteractionAction, 
    FocusInteractionAction, 
    GoBackwardInteractionAction,
    SelectOptionInteractionAction
)

from .assertion import (
    ASSERTION,
    AssertionAction
)

from .waiting import (
    WAITING,
    WaitingAction
)

BrowserAction = Union[InteractionAction, AssertionAction, WaitingAction]

from .browser_state import (
    BrowserState, 
    DOMElement
)