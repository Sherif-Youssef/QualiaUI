from __future__ import annotations
from pydantic import Field, TypeAdapter
from enum import Enum
from typing import Union, Literal, Annotated
from .base_action import Action, ACTION

class ASSERTION(str, Enum):
    AI_EVAL = "AI_EVAL"
    EXECUTE_JS_CODE = "EXECUTE_JS_CODE" 


class AssertionAction(Action):
    action_type: Literal[ACTION.ASSERTION]
    
    @classmethod
    def _parse_action(cls, obj) -> AssertionAction:
        return AssertionActionAdapter.validate_python(obj)

class AIEvalAssersionAction(AssertionAction):
    assertion_action_type: Literal[ASSERTION.AI_EVAL]
    prompt: str
    eval_result: bool

class ExecuteJSCodeAssertionAction(AssertionAction):
    assertion_action_type: Literal[ASSERTION.EXECUTE_JS_CODE]
    code: str

AssertionActionAdapter = TypeAdapter(
    Annotated[
        Union[
            AIEvalAssersionAction,
            ExecuteJSCodeAssertionAction,
        ], 
        Field(discriminator='assertion_action_type')
    ]
)