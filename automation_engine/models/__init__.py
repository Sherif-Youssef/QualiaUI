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
    InputInteractionAction,
    ClickInteractionAction,
    HoverInteractionAction,
    SelectOptionInteractionAction,
    PressInteractionAction,
    FocusInteractionAction,
    DragInteractionAction,
    ScrollInteractionAction,
    SelectOptionInteractionAction,
    ExecuteJSCodeInteractionAction
)

from .assertion import (
    ASSERTION,
    AssertionAction,
    AIEvalAssersionAction,
    ExecuteJSCodeAssertionAction
)

from .waiting import (
    WAITING,
    WaitingAction,
    TimeoutWaitingAction,
    StateWaitingAction,
    ExecuteJSCodeWaitingAction
)

BrowserAction = Union[InteractionAction, AssertionAction, WaitingAction]

from .browser_state import (
    BrowserState, 
    DOMElement,
    DOMState
)