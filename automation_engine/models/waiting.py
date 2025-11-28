from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action, ACTION

class WAITING(str, Enum):
    PLAIN = "PLAIN"


class WaitingAction(Action):
    action_type: Literal[ACTION.WAITING]
    pass