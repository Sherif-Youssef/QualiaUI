from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action
from .termination import TerminationAction, CompletedTerminationAction, FailedTerminationAction


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
        return isinstance(self.actions[-1], TerminationAction)
    
    def is_completed(self) -> bool:
        if not self.actions:
            return False
        return isinstance(self.actions[-1], CompletedTerminationAction) 
    
    def has_reached_limit(self) -> bool:
        return len(self.actions) >= self.max_actions