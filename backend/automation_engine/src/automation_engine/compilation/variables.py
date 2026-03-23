from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


class Variable(BaseModel):
    """Base variable model. Holds a name + description (shown to LLM) and a value (hidden)."""
    name: str = Field(description="Unique variable name, referenced via ${name} syntax.")
    description: str = Field(default="", description="Human-readable description shown to the LLM.")
    var_type: Literal["text", "file"]


class TextVariable(Variable):
    """A text variable whose value is substituted into string fields."""
    var_type: Literal["text"] = "text"
    value: str = Field(description="Actual text value (never shown to LLM).")


class FileVariable(Variable):
    """A file variable resolved into file-related actions (e.g. upload)."""
    var_type: Literal["file"] = "file"
    paths: list[Path] = Field(min_length=1, description="Absolute path(s) to file(s) on disk.")
    display_name: str | None = Field(default=None, description="File name shown to LLM.")


class VariableStore:
    """
    Dictionary-like container for variables.
    Provides an LLM-safe summary (no values) and internal resolution by name.
    """

    def __init__(self, variables: list[Variable] | None = None) -> None:
        self._vars: dict[str, Variable] = {}
        for v in variables or []:
            self.add(v)

    def add(self, variable: Variable) -> None:
        if variable.name in self._vars:
            raise ValueError(f"Duplicate variable name: {variable.name!r}")
        self._vars[variable.name] = variable

    def remove(self, name: str) -> None:
        if name not in self._vars:
            raise KeyError(f"Variable not found: {name!r}")
        del self._vars[name]

    def get(self, name: str) -> Variable:
        if name not in self._vars:
            raise KeyError(f"Variable not found: {name!r}")
        return self._vars[name]

    def get_text(self, name: str) -> TextVariable:
        var = self.get(name)
        if not isinstance(var, TextVariable):
            raise TypeError(f"Variable {name!r} is {var.var_type}, expected text.")
        return var

    def get_file(self, name: str) -> FileVariable:
        var = self.get(name)
        if not isinstance(var, FileVariable):
            raise TypeError(f"Variable {name!r} is {var.var_type}, expected file.")
        return var

    def has(self, name: str) -> bool:
        return name in self._vars

    @property
    def names(self) -> list[str]:
        return list(self._vars.keys())

    @property
    def text_variables(self) -> list[TextVariable]:
        return [v for v in self._vars.values() if isinstance(v, TextVariable)]

    @property
    def file_variables(self) -> list[FileVariable]:
        return [v for v in self._vars.values() if isinstance(v, FileVariable)]

    @property
    def all(self) -> list[Variable]:
        return list(self._vars.values())

    def __len__(self) -> int:
        return len(self._vars)

    def __contains__(self, name: str) -> bool:
        return name in self._vars

    def __iter__(self):
        return iter(self._vars.values())
