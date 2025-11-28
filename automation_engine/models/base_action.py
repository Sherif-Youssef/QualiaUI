from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC, abstractmethod

class ACTION(str, Enum):
    TERMINATION = "TERMINATION"
    INTERACTION = "INTERACTION"
    ASSERTION = "ASSERTION"
    WAITING = "WAITING"


class Action(BaseModel, ABC):
    timestamp: datetime = Field(default_factory=datetime.now)
    reasoning: Optional[str] = Field(default=None)
    success: Optional[bool] = Field(default=None)
    error: Optional[str] = Field(default=None)

    @classmethod
    @abstractmethod
    def _parse_action(cls, obj: dict) -> Action:
        """Implemented by the subclasses"""

    @classmethod
    def parse_action(cls, obj: dict) -> Action:
        action_type = obj.get("action_type")
        for subcls in cls.__subclasses__():
            
            subcls_action_type = subcls.model_fields.get("action_type").annotation.__args__[0].value
            if subcls_action_type == action_type:
                return subcls._parse_action(obj)
