from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action, ACTION

class ASSERTION(str, Enum):
    EXECUTE_JS_CODE = "EXECUTE_JS_CODE" 


class AssertionAction(Action):
    action_type: Literal[ACTION.ASSERTION]
    @classmethod
    def _parse_action(cls, obj):
        return AssertionActionAdapter.validate_python(obj)

class ExecuteJSCodeAssertionAction(AssertionAction):
    assertion_action_type: Literal[ASSERTION.EXECUTE_JS_CODE]
    code: str

AssertionActionAdapter = TypeAdapter(
    Annotated[
        Union[
            ExecuteJSCodeAssertionAction,
        ], 
        Field(discriminator='assertion_action_type')
    ]
)