from __future__ import annotations

from typing import Type

from .base import ExecAction
from ...actions.base import BaseAction


EXEC_REGISTRY: dict[Type[BaseAction], Type[ExecAction]] = {}
REVERSE_REGISTRY: dict[Type[ExecAction], Type[BaseAction]] = {}


def maps(action_cls: Type[BaseAction]):
    """Register the bidirectional mapping between an LLM action and its executable."""
    def decorator(exec_cls: Type[ExecAction]) -> Type[ExecAction]:
        EXEC_REGISTRY[action_cls] = exec_cls
        REVERSE_REGISTRY[exec_cls] = action_cls
        return exec_cls
    return decorator
