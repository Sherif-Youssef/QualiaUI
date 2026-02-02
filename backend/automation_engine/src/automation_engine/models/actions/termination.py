from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action, ACTION

class TERMINATION(str, Enum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


TerminationActionAdapter: TypeAdapter | None  = None

class TerminationAction(Action):
    action_type: Literal[ACTION.TERMINATION]
    

    @classmethod
    def _parse_action(cls, obj: dict) -> TerminationAction:
        return TerminationActionAdapter.validate_python(obj)


class CompletedTerminationAction(TerminationAction):
    termination_action_type: Literal[TERMINATION.COMPLETED]

class FailedTerminationAction(TerminationAction):
    termination_action_type: Literal[TERMINATION.FAILED]


TerminationActionAdapter = TypeAdapter(
    Annotated[
        Union[
            CompletedTerminationAction,
            FailedTerminationAction
        ], 
        Field(discriminator='termination_action_type')
    ]
)