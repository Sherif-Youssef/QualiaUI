from __future__ import annotations

import json
from typing import Any, Type, Union

from pydantic import BaseModel, Field
from pydantic_ai import StructuredDict
from .base import BaseTool


ExtractSchemaSpec = Union[str, dict[str, Any], Type[BaseModel]]


class ExtractStructuredDataTool(BaseTool):
    """
    Extracts structured data from a page's accessibility tree.
    """

    def __init__(
        self,
        schema: ExtractSchemaSpec,
        *,
        many: bool = False,
        name: str | None = None,
        description: str | None = None,
        instructions: str | None = None,
    ) -> None:
        self._name = name
        self._description = description
        self._instructions = instructions
        self._many = many

        inner = self._resolve_inner_type(schema)
        if many:
            inner = list[inner]  # type: ignore[valid-type]
        self._output_type = self._wrap_with_reasoning(inner)

    def output_type(self) -> Type[BaseModel]:
        return self._output_type

    def system_prompt(self) -> str:
        base = (
            "You extract structured data from a web page's accessibility tree.\n"
            "\n"
            "- Use the accessibility tree only as a source of information; do "
            "not interact with the page or describe the tree.\n"
            "- Only use values actually present in the tree — never invent or "
            "infer missing data.\n"
            "- Preserve original formatting (currency, units, casing) unless "
            "the schema or instruction dictates otherwise.\n"
            "- `data` must match the provided schema exactly.\n"
            "- `reasoning`: one short sentence on what you used.\n"
            "- `confidence`: 0.0-1.0, how sure you are `data` is correct and "
            "complete."
        )
        if self._instructions:
            return f"{base}\n\nAdditional instructions:\n{self._instructions}"
        return base

    def _resolve_inner_type(self, schema: ExtractSchemaSpec) -> Any:
        # Pydantic model
        if isinstance(schema, type) and issubclass(schema, BaseModel):
            return schema

        # Already a dict JSON schema
        if isinstance(schema, dict):
            return self._build_structured_dict(schema)

        # JSON-encoded string
        if isinstance(schema, str):
            try:
                parsed = json.loads(schema)
            except json.JSONDecodeError as e:
                raise ValueError(f"schema string is not valid JSON: {e}") from e
            return self._build_structured_dict(parsed)

        raise TypeError(
            "`schema` must be a JSON-schema str, a dict, or a BaseModel "
            f"subclass — got {type(schema).__name__}"
        )

    def _build_structured_dict(self, json_schema: dict[str, Any]) -> Any:
        return StructuredDict(
            json_schema,
            name=self._name,
            description=self._description,
        )

    def _wrap_with_reasoning(self, inner: Any) -> Type[BaseModel]:
        class ExtractedData(BaseModel):
            f"""{self._description}"""
            reasoning: str = Field(
                description=(
                    "Concise explanation of which "
                    "parts of the accessibility tree were used to "
                    "populate `data`."
                )
            )
            confidence: float = Field(ge=0.0, le=1.0, 
                description="Confidence in [0.0, 1.0] that `data` is fully correct and complete."
            )
            data: inner = Field(description="The extracted structured data.") # type: ignore
        
        return ExtractedData
