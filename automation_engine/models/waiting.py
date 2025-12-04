from __future__ import annotations
from pydantic import Field, TypeAdapter
from enum import Enum
from typing import Union, Literal, Annotated
from .base_action import Action, ACTION

class WAITING(str, Enum):
    TIMEOUT = "TIMEOUT"
    STATE = "STATE"
    EXECUTE_JS_CODE = "EXECUTE_JS_CODE"

WaitingActionAdapter: TypeAdapter | None = None

MAX_TIMEOUT_MS = 60 * 1000

class WaitingAction(Action):
    action_type: Literal[ACTION.WAITING]
    timeout_ms: float | None = None
    
    @classmethod
    def _parse_action(cls, obj) -> WaitingAction:
        return WaitingActionAdapter.validate_python(obj)
    
    def get_timeout(self) -> None:
        if self.timeout_ms is None or self.timeout_ms > MAX_TIMEOUT_MS:
            return MAX_TIMEOUT_MS
        return self.timeout_ms

class TimeoutWaitingAction(WaitingAction):
    waiting_action_type: Literal[WAITING.TIMEOUT]

class StateWaitingAction(WaitingAction):
    waiting_action_type: Literal[WAITING.STATE]
    target_id: int
    target_state: Literal["attached", "detached", "hidden", "visible"]

class ExecuteJSCodeWaitingAction(WaitingAction):
    waiting_action_type: Literal[WAITING.EXECUTE_JS_CODE]
    code: str

WaitingActionAdapter = TypeAdapter(
    Annotated[
        Union[
            TimeoutWaitingAction,
            StateWaitingAction,
            ExecuteJSCodeWaitingAction
        ], 
        Field(discriminator='waiting_action_type')
    ]
)