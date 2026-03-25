from __future__ import annotations

from base64 import b64encode
from pathlib import Path
from typing import Callable
from pydantic import BaseModel, Field
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import Runnable, RunnableLambda

from ..actions import ActionOutput, TerminationOutput
from .state import FullInputState


def _patch_schema(schema):
    if isinstance(schema, list):
        return [_patch_schema(i) for i in schema]
    if isinstance(schema, dict):
        return {
            ("anyOf" if k == "oneOf" else k): _patch_schema(v)
            for k, v in schema.items()
        }
    return schema


# Response model


class PlanningOutput(BaseModel):
    """Single-step planning output."""
    reasoning: str = Field(
        description=(
            "Brief analysis: what is the current state, what needs to happen next, "
            "and is the task complete or not? Decide BEFORE responding."
        ),
    )
    output: ActionOutput | TerminationOutput # type: ignore

    @classmethod
    def model_json_schema(cls, *args, **kwargs):
        return _patch_schema(super().model_json_schema(*args, **kwargs))


class GroupPlanningOutput(PlanningOutput):
    """Grouped-step planning output."""
    output: list[ActionOutput] | TerminationOutput # type: ignore

# Helpers

def _encode_screenshot(screenshot: str | bytes | Path) -> str:
    if isinstance(screenshot, Path):
        screenshot = screenshot.read_bytes()
    if isinstance(screenshot, bytes):
        return b64encode(screenshot).decode("utf-8")
    return screenshot


def _build_human_content(
    text: str,
    screenshot: str | bytes | Path | None = None,
) -> list[dict] | str:
    if screenshot is None:
        return text

    b64 = _encode_screenshot(screenshot)
    return [
        {"type": "text", "text": text},
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{b64}",
                "detail": "high",
            },
        },
    ]


def _make_message_formatter(system: str) -> Callable[[FullInputState]]:
    """
    Returns a function that converts input dict -> message list.
    Wrapped in RunnableLambda to stay in the Runnable ecosystem.
    """

    def _format(state: FullInputState) -> list:
        parts = [
            f"## Task\n{state.instruction}",
            f"\n\n## Current Page\n```\n{state.page}\n```",
        ]

        if state.history:
            parts.append(f"\n\n## Action History\n{state.history}")

        parts.append("\n\nDecide and return your response.")

        content = _build_human_content(
            "".join(parts),
            state.screenshot,
        )

        return [
            SystemMessage(content=system),
            HumanMessage(content=content),
        ]

    return _format


def _extract_json_text(text: str) -> str:
    """Strip markdown fences / surrounding prose to isolate JSON."""
    import re
    fence = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
    if fence:
        return fence.group(1).strip()
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last > first:
        return text[first : last + 1]
    return text.strip()


def _make_json_parser(schema: type[BaseModel]) -> Callable:
    """Parse raw AIMessage content -> Pydantic model."""
    def _parse(message):
        content = message.content if hasattr(message, "content") else str(message)
        json_str = _extract_json_text(content)
        try:
            return schema.model_validate_json(json_str)
        except Exception as exc:
            raise ValueError(
                f"Failed to parse LLM output as {schema.__name__}.\n"
                f"Extracted JSON:\n{json_str}\n"
                f"Error: {exc}"
            ) from exc
    return _parse


def _get_formatted_json_schema(schema: type[BaseModel]) -> str:
    # TODO: needs to be formatted nicely for readability, with comments, examples, etc.
    import json
    raw_schema = schema.model_json_schema()
    schema_str = json.dumps(raw_schema, indent=2)

    return (
        "\n\n## RESPONSE FORMAT - IMPORTANT\n"
        "You do NOT have access to function/tool calling.\n"
        "You MUST respond with a **single raw JSON object** that "
        "conforms exactly to this JSON Schema:\n\n"
        f"```json\n{schema_str}\n```\n\n"
        "Rules:\n"
        "- Output ONLY the JSON object - no markdown fences, no extra text.\n"
        "- All required fields must be present.\n"
        "- Use the exact field names and types from the schema.\n"
        "- For discriminated unions, include the discriminator field "
        "with the correct literal value.\n"
    )


TestingChain = Runnable[FullInputState, PlanningOutput]

# API

def build_chain(
    llm: BaseChatModel,
    system_prompt: str | None = None,
    allow_grouped_steps: bool = False,
    tooling: bool = False,
) -> TestingChain:
    """Chain factory"""
    if allow_grouped_steps:
        system = system_prompt or (_BASE_SYSTEM + _GROUP_ADDENDUM)
        schema = GroupPlanningOutput
    else:
        system = system_prompt or (_BASE_SYSTEM + _STEP_ADDENDUM)
        schema = PlanningOutput

    if tooling:
        formatter = RunnableLambda(_make_message_formatter(system))
        return formatter | llm.with_structured_output(schema)
    else:
        formatter = RunnableLambda(_make_message_formatter(system + _get_formatted_json_schema(schema)))
        parser = RunnableLambda(_make_json_parser(schema))
        return formatter | llm | parser


# Prompts

_BASE_SYSTEM = """\
You are a browser automation agent. Given the current page state, decide the \
next action(s) to accomplish the user's task.

## Page Format

  [N] tag (visibility) attributes text="..."
  [#N] = interactive (targetable)

- N = serialization ID (not HTML id). Use in target_id fields.
- Indentation = parent/child. DISABLED/REQUIRED/CHECKED in uppercase.
- Screenshot (if present) provides visual context.

## Variables

- **Text** `${name}`: When the task contains `${name}`, copy it\
into the relevant field. Never guess or substitute variable names.
- **File**: When the task references a file variable by name, use it in `file_vars`. \

## Termination

**"complete"**: Task is 100% done. Any step remaining → emit action instead.

**"fail"**: Emit with a specific reason when:
- Required element missing/unreachable.
- Page error, 404, access-denied, or blocking state.
- Impossible precondition (option/button doesn't exist or is permanently disabled).
- External blocker (CAPTCHA, MFA, paywall).
- A prior action failed or produced an unexpected result.
- Task is contradictory or requires nonexistent information.

Never skip a required step — accomplish it or fail.

## Action History

Prior actions + outcomes. **You MUST check this before every decision.**
- If any action failed or errored → emit "fail" immediately. Do NOT retry it.
- If the page state after an action doesn't match what was expected → emit "fail".
- NEVER repeat an action that already appears in the history. \
If the logical next step is something you already did → either the task is \
"complete" or something went wrong and you must "fail".

## Decision Process

1. Check history: any failure or unexpected outcome? → "fail".
2. Check history: about to repeat a prior action? → STOP. "complete" or "fail".
3. Goal satisfied? → "complete".
4. Goal impossible from current state? → "fail".
5. Else → emit NEW action(s). Add assertions when useful.

## Rules

- target_id must match [#N] in the DOM for interactions. [#N] or [N] must match for assertions. Never invent IDs.
- Reasoning: 1-3 sentences tied to visible elements.
- Prefer minimal actions.
- Only use timeout when mentioned in the task

## recreation_prompt

Plain language, no IDs, no variable values. Use `${name}` for variables.

## JavaScript (execute_js / assert_js_eval)

Reference elements as {{ID_N}}, quote the placeholders. Guard null. \
Wrap in () => { ... }. Assertions return true/false. Use only as last resort.
"""

_STEP_ADDENDUM = """\
## Mode: Single Step

Emit exactly ONE action or termination. Page is re-observed after execution.
If a prior action failed, errored, or the page is unexpected → "fail". No retries.
"""

_GROUP_ADDENDUM = """\
## Mode: Action Group

Emit actions executable sequentially WITHOUT re-observing between them.

**Group when:** targets visible+stable, no navigation/re-render, logically related.
**Split when:** action triggers navigation, re-renders, or needs verification.

Verify every target_id exists as [#N] before grouping.
If done → "complete". If impossible → "fail" with reason.
"""
