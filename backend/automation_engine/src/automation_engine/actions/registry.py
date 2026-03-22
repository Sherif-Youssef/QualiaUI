from __future__ import annotations

from typing import Annotated, Type, Union

from pydantic import Field, TypeAdapter, BaseModel

from .base import BaseAction, TerminationSignal

_ACTION_REGISTRY: dict[str, Type[BaseAction]] = {}
_TERMINATION_REGISTRY: dict[str, Type[TerminationSignal]] = {}

_action_adapter_cache: TypeAdapter | None = None
_output_adapter_cache: TypeAdapter | None = None


def _register(registry: dict, cls: Type[BaseModel]) -> type:
    """Shared registration logic."""
    global _action_adapter_cache, _output_adapter_cache

    field = cls.model_fields.get("action_type")
    if field is None or field.default is None:
        raise TypeError(f"{cls.__name__} must define `action_type` with a Literal default.")

    key = field.default
    all_keys = {**_ACTION_REGISTRY, **_TERMINATION_REGISTRY}
    if key in all_keys:
        raise ValueError(f"action_type '{key}' already claimed by {all_keys[key].__name__}")

    registry[key] = cls
    _action_adapter_cache = None
    _output_adapter_cache = None
    return cls


# Decorators
def action(cls: Type[BaseAction]) -> Type[BaseAction]:
    """Register a storable action (interaction or assertion)."""
    return _register(_ACTION_REGISTRY, cls)


def termination(cls: Type[TerminationSignal]) -> Type[TerminationSignal]:
    """Register a termination signal."""
    return _register(_TERMINATION_REGISTRY, cls)


#  Union builders
def build_action_type():
    """Exectuable actions (interactions + assertions)."""
    if not _ACTION_REGISTRY:
        raise RuntimeError("No actions registered.")
    return Annotated[
        Union[tuple(_ACTION_REGISTRY.values())],
        Field(discriminator="action_type"),
    ]


def build_output_type():
    """All steps: actions + termination signals."""
    all_types = list(_ACTION_REGISTRY.values()) + list(_TERMINATION_REGISTRY.values())
    if not all_types:
        raise RuntimeError("Nothing registered.")
    return Annotated[
        Union[tuple(all_types)],
        Field(discriminator="action_type"),
    ]


# TypeAdapter factories
def build_action_adapter() -> TypeAdapter:
    global _action_adapter_cache
    if _action_adapter_cache is None:
        _action_adapter_cache = TypeAdapter(build_action_type())
    return _action_adapter_cache


def build_output_adapter() -> TypeAdapter:
    global _output_adapter_cache
    if _output_adapter_cache is None:
        _output_adapter_cache = TypeAdapter(build_output_type())
    return _output_adapter_cache


# Utils
def parse_action(raw: dict) -> BaseAction:
    return build_action_adapter().validate_python(raw)


def parse_output(raw: dict) -> BaseAction | TerminationSignal:
    return build_output_adapter().validate_python(raw)


def get_registry() -> dict[str, type]:
    return {**_ACTION_REGISTRY, **_TERMINATION_REGISTRY}
