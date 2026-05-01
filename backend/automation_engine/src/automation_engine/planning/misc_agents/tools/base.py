from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Type

from pydantic import BaseModel


class BaseTool(ABC):

    @abstractmethod
    def output_type(self) -> Type[BaseModel]:
        ...

    @abstractmethod
    def system_prompt(self) -> str:
        ...
