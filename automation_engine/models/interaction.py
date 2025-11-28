from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action, ACTION

class INTERACTION(str, Enum):
    CLICK = "CLICK"
    INPUT = "INPUT"
    SELECT_OPTION = "SELECT_OPTION"
    DRAG = "DRAG"
    HOVER = "HOVER"
    FOCUS = "FOCUS"
    GO_BACKWARD = "GO_BACKWARD"

InteractionActionAdapter: TypeAdapter | None  = None

class InteractionAction(Action):
    action_type: Literal[ACTION.INTERACTION]
    
    @classmethod
    def _parse_action(cls, obj):
        return InteractionActionAdapter.validate_python(obj)


class ClickInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.CLICK]  
    target_id: int


class InputField(BaseModel):
    target_id: int
    input: str
    
class InputInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.INPUT]
    input: List[InputField]


class SelectOptionInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.SELECT_OPTION]
    select_element_id: int
    option_element_id: int

class DragInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.DRAG]
    source_id: int
    target_id: int

class HoverInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.HOVER]
    target_id: str

class FocusInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.FOCUS]
    target_id: str

class GoBackwardInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.GO_BACKWARD]

InteractionActionAdapter = TypeAdapter(
    Annotated[
        Union[
            ClickInteractionAction, 
            InputInteractionAction, 
            DragInteractionAction, 
            HoverInteractionAction, 
            FocusInteractionAction, 
            GoBackwardInteractionAction, 
            SelectOptionInteractionAction
        ], 
        Field(discriminator='interaction_action_type')
    ]
)