from typing import Union

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

__all__ = [
    # base_action
    "ACTION",
    "Action",

    # termination
    "TERMINATION",
    "TerminationAction",
    "CompletedTerminationAction",
    "FailedTerminationAction",

    # interaction
    "INTERACTION",
    "InteractionAction",
    "InputInteractionAction",
    "ClickInteractionAction",
    "HoverInteractionAction",
    "SelectOptionInteractionAction",
    "PressInteractionAction",
    "FocusInteractionAction",
    "DragInteractionAction",
    "ScrollInteractionAction",
    "ExecuteJSCodeInteractionAction",

    # assertion
    "ASSERTION",
    "AssertionAction",
    "AIEvalAssersionAction",
    "ExecuteJSCodeAssertionAction",

    # waiting
    "WAITING",
    "WaitingAction",
    "TimeoutWaitingAction",
    "StateWaitingAction",
    "ExecuteJSCodeWaitingAction",

    # union type
    "BrowserAction",
]
