from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action, ACTION

class INTERACTION(str, Enum):
    INPUT = "INPUT"
    CLICK = "CLICK"
    HOVER = "HOVER"
    SELECT_OPTION = "SELECT_OPTION"
    PRESS = "PRESS"
    FOCUS = "FOCUS"
    DRAG = "DRAG"
    SCROLL = "SCROLL"
    GO_TO = "GO_TO"
    GO_BACKWARD = "GO_BACKWARD"
    RAW_EVENT = "RAW_EVENT"

InteractionActionAdapter: TypeAdapter | None  = None

class InteractionAction(Action):
    action_type: Literal[ACTION.INTERACTION]
    
    @classmethod
    def _parse_action(cls, obj):
        return InteractionActionAdapter.validate_python(obj)

class InputField(BaseModel):
    target_id: int
    input: str

class InputInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.INPUT]
    input: List[InputField]

class ClickInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.CLICK]
    target_id: int
    double_click: bool = False
    button: Literal['left', 'middle', 'right'] = 'left'
    keyboard_modifiers: List[Literal['Alt', 'ControlOrMeta', 'Shift']] = []

class HoverInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.HOVER]
    target_id: str

class SelectOptionInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.SELECT_OPTION]
    select_element_id: int
    option_element_id: int

class PressInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.PRESS]  
    target_id: int
    key_strokes: List[str]

class FocusInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.FOCUS]
    target_id: int

class DragInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.DRAG]
    source_id: int
    target_id: int

class ScrollInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.SCROLL]
    target_id: int

class GoToInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.GO_TO]
    url: str

class GoBackwardInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.GO_BACKWARD]

class RawEventInteractionAction(InteractionAction):
    interaction_action_type: Literal[INTERACTION.RAW_EVENT]
    target_id: int
    event_type: str

InteractionActionAdapter = TypeAdapter(
    Annotated[
        Union[
            InputInteractionAction,
            ClickInteractionAction,
            HoverInteractionAction,
            SelectOptionInteractionAction,
            PressInteractionAction,
            FocusInteractionAction,
            DragInteractionAction,
            ScrollInteractionAction,
            GoToInteractionAction,
            GoBackwardInteractionAction,
            RawEventInteractionAction
        ],
        Field(discriminator='interaction_action_type')
    ]
)