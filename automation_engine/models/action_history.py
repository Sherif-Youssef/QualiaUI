from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC

class ACTION(str, Enum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    
    CLICK = "CLICK"
    INPUT = "INPUT"
    OPTION = "OPTION"

    DRAG = "DRAG"
    HOVER = "HOVER"
    FOCUS = "FOCUS"

    SCROLL = "SCROLL"
    WAIT = "WAIT"
    GO_BACKWARD = "GO_BACKWARD"

class Action(BaseModel, ABC):
    timestamp: datetime = Field(default_factory=datetime.now)
    reasoning: Optional[str] = Field(default=None)
    success: Optional[bool] = Field(default=None)
    error: Optional[str] = Field(default=None)

## terminating actions

class TerminatingAction(Action, ABC):
    pass

class CompletedAction(TerminatingAction):
    action_type: Literal[ACTION.COMPLETED]

class FailedAction(TerminatingAction):
    action_type: Literal[ACTION.FAILED]
    fail_reason: str

## browser actions

class BrowserAction(Action, ABC):
    pass

class ClickAction(BrowserAction):
    action_type: Literal[ACTION.CLICK]  
    target_id: int

class Input(BaseModel):
    target_id: int
    input: str
    
class InputAction(BrowserAction):
    action_type: Literal[ACTION.INPUT]
    input: List[Input]

class SelectOptionAction(BrowserAction):
    action_type: Literal[ACTION.OPTION]
    select_element_id: int
    option_element_id: int

class DragAction(BrowserAction):
    action_type: Literal[ACTION.DRAG]
    source_id: int
    target_id: int

class HoverAction(BrowserAction):
    action_type: Literal[ACTION.HOVER]
    target_id: str

class FocusAction(BrowserAction):
    action_type: Literal[ACTION.FOCUS]
    target_id: str

class GoBackwardAction(BrowserAction):
    action_type: Literal[ACTION.GO_BACKWARD]

class WaitAction(BrowserAction):
    action_type: Literal[ACTION.WAIT]

class ScrollAction(BrowserAction):
    action_type: Literal[ACTION.SCROLL]
    x: int
    y: int


    

ActionAdapter = TypeAdapter(
    Annotated[
        Union[
            CompletedAction, 
            FailedAction, 
            ClickAction, 
            InputAction, 
            DragAction, 
            HoverAction, 
            FocusAction, 
            GoBackwardAction, 
            WaitAction, 
            ScrollAction,
            SelectOptionAction
        ], 
        Field(discriminator='action_type')
    ]
)


class AgentHistory(BaseModel):    
    goal: str 
    actions: List[Action] = Field(default_factory=list, description="List of sorted actions taken")
    max_actions: int = Field(default=50, description="Maximum actions to prevent infinite loops")
    start_time: datetime = Field(default_factory=datetime.now)
    
    def add_action(self, action: Action) -> None:
        self.actions.append(action)
    
    def is_finished(self) -> bool:
        if not self.actions:
            return False
        return isinstance(self.actions[-1], TerminatingAction)
    
    def is_completed(self) -> bool:
        if not self.actions:
            return False
        return isinstance(self.actions[-1], CompletedAction) 
    
    def has_reached_limit(self) -> bool:
        return len(self.actions) >= self.max_actions