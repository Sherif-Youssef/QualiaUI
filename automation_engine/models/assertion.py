from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
from typing import Union, Literal, Optional, Annotated, List, Dict
from pydantic import TypeAdapter
from abc import ABC
from .base_action import Action, ACTION

class ASSERTION(str, Enum):
    EQUAL = "EQUAL"


class AssertionAction(Action):
    action_type: Literal[ACTION.ASSERTION]
    pass