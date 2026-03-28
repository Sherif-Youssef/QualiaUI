from __future__ import annotations

from typing import Type, Annotated, Union
from pydantic import Field

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


def build_exec_action_type():
    """Executable actions (interactions + assertions)."""
    if not EXEC_REGISTRY:
        raise RuntimeError("No executable actions registered.")
    return Annotated[
        Union[tuple(EXEC_REGISTRY.values())],
        Field(discriminator="action_type"),
    ]