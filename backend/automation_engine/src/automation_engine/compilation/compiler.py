"""
Maps action models → executable action models.
Resolves element IDs to CSS selectors, transforms fields to match
PlaywrightBrowser method signatures.
"""

from __future__ import annotations

import re
import inspect
from pathlib import Path
from typing import Type, Callable, get_type_hints, Optional
from pydantic import BaseModel, ConfigDict

from ..actions import (
    BaseAction,
    Waiting, Click, Fill, Hover, SelectOption,
    Press, Navigate, Scroll, DragDrop,
    UploadFile, ExecuteJS,
    AssertState, AssertTextRegex, AssertChecked,
    AssertElementCount, AssertJSEval,
)
from .executable_actions import (
    ExecAction,
    WaitingExec, ClickExec, FillExec, HoverExec,
    SelectOptionExec, PressExec, NavigateExec,
    ScrollExec, DragDropExec, UploadFileExec, ExecuteJSExec,
    AssertStateExec, AssertTextRegexExec, AssertCheckedExec,
    AssertElementCountExec, AssertJSEvalExec,
)
from .executable_actions.registry import EXEC_REGISTRY
from .markers import SourcedFrom, ElementRef, TextResolvable, FileVarRef, JSResolvable
from ..planning.state import DOMIndex
from .variables import VariableStore
from .exceptions import CompilationError


class CompileContext(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    dom_index: Optional[DOMIndex] = None
    variables: VariableStore


class ActionCompiler:
    """Translates action models into executable action models by resolving
    element IDs to CSS selectors and transforming fields."""

    _PLACEHOLDER_RE = re.compile(r"\{ID_(\d+)\}")
    _VAR_PATTERN = re.compile(r"\$\{([^}]+)\}")
    _dispatch: dict[Type[BaseAction], Callable] = None

    @classmethod
    def build_dispatch(cls) -> None:
        cls._dispatch = {}
        for _, member in inspect.getmembers(cls, predicate=inspect.isfunction):
            hints = get_type_hints(member)
            if "action" not in hints:
                continue
            action_type = hints["action"]
            if action_type and issubclass(action_type, BaseAction) and member is not BaseAction:
                cls._dispatch[action_type] = member
    
    def __init__(self, ctx: CompileContext) -> None:
        self._ctx = ctx

    # Helpers

    def _sel(self, element_id: int) -> str:
        return self._ctx.dom_index.selector(element_id)

    def _resolve_js(self, code: str) -> str:
        def _replace(match: re.Match) -> str:
            element_id = int(match.group(1))
            selector = self._ctx.dom_index.selector(element_id)
            return selector

        return self._PLACEHOLDER_RE.sub(_replace, code)
    
    def _resolve_file_var(self, file_var: str | list[str]) -> list[Path]:
        file_vars = file_var if isinstance(file_var, list) else [file_var]
        file_paths = []
        for var in file_vars:
            if not isinstance(var, Path):
                name = var.strip()
                in_var_syntax = self._VAR_PATTERN.match(name)
                name = in_var_syntax.group(1) if in_var_syntax else name
                name = name.strip()
                file_paths.extend(self._ctx.variables.get_file(name).paths)
        return file_paths

    def _resolve_text(self, text: str) -> str:
        def _replace(match: re.Match) -> str:
            name = match.group(1)
            return self._ctx.variables.get_text(name).value
        return self._VAR_PATTERN.sub(_replace, text)

    # API

    def compile(self, action: BaseAction, resolve_vars: bool = True) -> ExecAction:
        handler = self._dispatch.get(type(action))
        if handler is not None:
            return handler(self, action, resolve_vars=resolve_vars)
        
        exec_action_cls = EXEC_REGISTRY[type(action)]
        return exec_action_cls(**self._generic_compile(action, resolve_vars=resolve_vars))
    
    def resolve_vars(self, exec_action: ExecAction) -> ExecAction:
        exec_action_cls = type(exec_action)
        processed_attrs = {}

        for name, field in exec_action_cls.model_fields.items():
            value = getattr(exec_action, name)
            for marker in field.metadata:
                if isinstance(marker, TextResolvable):
                    value = self._resolve_text(value)
                elif isinstance(marker, FileVarRef):
                    value = self._resolve_file_var(value)
            
            processed_attrs[name] = value
        
        return exec_action_cls(**processed_attrs)

    def _generic_compile(self, action: BaseAction, resolve_vars: bool) -> dict:
        exec_action_cls = EXEC_REGISTRY[type(action)]

        def resolve_source(field_name, field):
            for marker in field.metadata:
                if isinstance(marker, SourcedFrom):
                    return marker.source
            return field_name

        def apply_markers(value, field):
            if value is None:
                return None

            for marker in field.metadata:
                if isinstance(marker, SourcedFrom):
                    continue

                if isinstance(marker, ElementRef):
                    value = self._sel(value)
                elif isinstance(marker, JSResolvable):
                    value = self._resolve_js(value)
                elif isinstance(marker, TextResolvable):
                    if resolve_vars:
                        value = self._resolve_text(value)
                elif isinstance(marker, FileVarRef):
                    if resolve_vars:
                        value = self._resolve_file_var(value)

            return value

        processed_attrs = {}

        for name, field in exec_action_cls.model_fields.items():
            src_name = resolve_source(name, field)
            value = getattr(action, src_name, None)
            value = apply_markers(value, field)
            processed_attrs[name] = value

        return processed_attrs

    def _compile_select_option(self, action: SelectOption, resolve_vars: bool) -> SelectOptionExec:
        attrs = self._generic_compile(action, resolve_vars=resolve_vars)
        
        match action.select_by:
            case "value":
                attrs["value"] = str(action.select_value)
            case "label":
                attrs["label"] = str(action.select_value)
            case "index":
                attrs["index"] = int(action.select_value)
            case "element":
                option_el = self._ctx.dom_index[int(action.select_value)]
                option_value = option_el.attr("value")
                if option_value is not None:
                    attrs["value"] = option_value
                elif option_el.text is not None:
                    attrs["label"] = option_el.text
                else:
                    raise CompilationError(
                        f"Option element {action.select_value} has neither a value attribute nor text content."
                    )

        return SelectOptionExec(**attrs)
    

ActionCompiler.build_dispatch()
