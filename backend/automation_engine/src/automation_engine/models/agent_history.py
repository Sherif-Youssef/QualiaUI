import json
from abc import ABC
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Union, Literal, Optional, Annotated, List, Dict
from automation_engine.models.actions import Action, TerminationAction, CompletedTerminationAction, FailedTerminationAction


class AgentHistory(BaseModel):    
    goal: str = Field(default_factory=str)
    start_time: datetime = Field(default_factory=datetime.now)
    actions: List[Action] = Field(default_factory=list, description="List of sorted actions taken")
    
    def update_goal(self, new_goal) -> None:
        self.goal += f"{new_goal}\n"

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
    
    def is_failed(self) -> bool:
        if not self.actions:
            return False
        return isinstance(self.actions[-1], FailedTerminationAction) 
    
    def to_llm_string(self) -> str:
        data = {
            "goal": self.goal,
            "start_time": self.start_time.isoformat(),
            "actions": [action.model_dump() for action in self.actions]
        }
        return json.dumps(data, default=str)
