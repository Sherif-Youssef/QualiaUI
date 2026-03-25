from __future__ import annotations

from typing import Annotated, Type, Union

from pydantic import Field, TypeAdapter, BaseModel

from .base import BaseAction, TerminationSignal

_ACTION_REGISTRY: dict[str, Type[BaseAction]] = {}
_TERMINATION_REGISTRY: dict[str, Type[TerminationSignal]] = {}

_action_adapter_cache: TypeAdapter | None = None
_termination_adapter_cache: TypeAdapter | None = None


def _register(registry: dict, cls: Type[BaseModel], type_field: str) -> type:
    """Shared registration logic."""
    global _action_adapter_cache, _termination_adapter_cache

    field = cls.model_fields.get(type_field)
    if field is None or field.default is None:
        raise TypeError(
            f"{cls.__name__} must define `{type_field}` with a Literal default."
        )

    key = field.default
    if key in registry:
        raise ValueError(f"{type_field} '{key}' already claimed by {registry[key].__name__}")

    registry[key] = cls
    _action_adapter_cache = None
    _termination_adapter_cache = None
    return cls


# Decorators

def action(cls: Type[BaseAction]) -> Type[BaseAction]:
    """Register a storable action (interaction or assertion)."""
    return _register(_ACTION_REGISTRY, cls, "action_type")


def termination(cls: Type[TerminationSignal]) -> Type[TerminationSignal]:
    """Register a termination signal."""
    return _register(_TERMINATION_REGISTRY, cls, "termination_type")


# Union builders

def build_action_type():
    """Executable actions (interactions + assertions)."""
    if not _ACTION_REGISTRY:
        raise RuntimeError("No actions registered.")
    return Annotated[
        Union[tuple(_ACTION_REGISTRY.values())],
        Field(discriminator="action_type"),
    ]


def build_termination_type():
    """Only termination signals."""
    if not _TERMINATION_REGISTRY:
        raise RuntimeError("No terminations registered.")
    return Annotated[
        Union[tuple(_TERMINATION_REGISTRY.values())],
        Field(discriminator="termination_type"),
    ]


# TypeAdapter factories

def build_action_adapter() -> TypeAdapter:
    global _action_adapter_cache
    if _action_adapter_cache is None:
        _action_adapter_cache = TypeAdapter(build_action_type())
    return _action_adapter_cache


def build_termination_adapter() -> TypeAdapter:
    global _termination_adapter_cache
    if _termination_adapter_cache is None:
        _termination_adapter_cache = TypeAdapter(build_termination_type())
    return _termination_adapter_cache


# Parsing helpers

def parse_action(raw: dict) -> BaseAction:
    return build_action_adapter().validate_python(raw)


def parse_termination(raw: dict) -> TerminationSignal:
    return build_termination_adapter().validate_python(raw)


# Registry access

def get_action_registry() -> dict[str, Type[BaseAction]]:
    return dict(_ACTION_REGISTRY)


def get_termination_registry() -> dict[str, Type[TerminationSignal]]:
    return dict(_TERMINATION_REGISTRY)
