from __future__ import annotations

from base64 import b64encode
from pathlib import Path
from typing import Callable
from pydantic import BaseModel, Field
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import Runnable, RunnableLambda

from ..actions import Output, BaseAction, TerminationSignal


def _patch_schema(schema):
    if isinstance(schema, list):
        return [_patch_schema(i) for i in schema]
    if isinstance(schema, dict):
        return {
            ("anyOf" if k == "oneOf" else k): _patch_schema(v)
            for k, v in schema.items()
        }
    return schema


# Response models

class StepResponse(BaseModel):
    """LLM emits one action or terminates."""

    output: Output  # type: ignore
    reasoning: str = Field(
        description=(
            "Brief analysis: what is the current state, what needs to happen next, "
            "and is the task complete or not? Decide BEFORE choosing an action."
        ),
    )

    
    @classmethod
    def model_json_schema(cls, *args, **kwargs):
        return _patch_schema(super().model_json_schema(*args, **kwargs))


class ActionGroupResponse(BaseModel):
    """
    LLM emits a batch of actions that can run sequentially
    WITHOUT re-observing the page, OR a single termination signal.

    Group together actions when all targets are visible and stable
    and no action causes navigation or significant re-render.
    """

    reasoning: str = Field(
        description=(
            "Why these actions are grouped and what they accomplish as a unit. "
            "Mention if a page change is expected after execution."
        ),
    )
    output: list[Output]  # type: ignore

    @classmethod
    def model_json_schema(cls, *args, **kwargs):
        return _patch_schema(super().model_json_schema(*args, **kwargs))


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


def _make_message_formatter(system: str) -> Callable[[dict]]:
    """
    Returns a function that converts input dict -> message list.
    Wrapped in RunnableLambda to stay in the Runnable ecosystem.
    """

    def _format(inputs: dict) -> list:
        parts = [
            f"## Task\n{inputs['instruction']}",
            f"\n\n## Current Page\n```\n{inputs['page']}\n```",
        ]

        history = inputs.get("history")
        if history:
            parts.append(f"\n\n## Action History\n{history}")

        parts.append("\n\nDecide and return your response.")

        content = _build_human_content(
            "".join(parts),
            inputs.get("screenshot"),
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
    """Parse raw AIMessage content → Pydantic model."""
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


# API

def build_chain(
    llm: BaseChatModel,
    system_prompt: str | None = None,
    group_response: bool = False,
    tooling: bool = False,
) -> Runnable:
    """Chain factory"""
    if group_response:
        system = system_prompt or (_BASE_SYSTEM + _GROUP_ADDENDUM)
        schema = ActionGroupResponse
    else:
        system = system_prompt or (_BASE_SYSTEM + _STEP_ADDENDUM)
        schema = StepResponse
    
    if tooling:
        formatter = RunnableLambda(_make_message_formatter(system))
        return formatter | llm.with_structured_output(schema, strict=True)
    else:
        formatter = RunnableLambda(_make_message_formatter(system + _get_formatted_json_schema(schema)))
        parser = RunnableLambda(_make_json_parser(schema))
        return formatter | llm | parser


# Prompts

_BASE_SYSTEM = """\
You are a browser automation agent. Given the current page state, decide the \
next action(s) to accomplish the user's task.

## Page Format

Serialized DOM with elements shown as:
  [N] tag (visibility) attributes text="..." (can be used in assertions)
  [#N] = interactive (only these can be targeted in interactions, can be used in assertions too)

- N = serialization ID (not HTML id). Use in target_id fields.
- Indentation = parent/child. DISABLED/REQUIRED/CHECKED in uppercase.
- Use screenshot (if present) for visual context.


## CRITICAL: Termination Rules

- "complete" means the task is 100% DONE — not "I know what to do next".
- If there are remaining steps (navigation, clicks, form submissions), \
emit an ACTION, not a termination.
- Ask yourself: "If I stop now, has the user's goal been fully achieved?"
  - YES → "complete"
  - NO → emit the next action


## Action History

Log of prior actions + outcomes. Use to track progress, avoid repeats, \
detect completion.

## Decision Process

1. Check if goal is ALREADY done → emit "complete".
2. Pick action(s) that most directly advance the goal.
3. If stuck/impossible (CAPTCHA, broken page) → emit "fail" with reason.

## Rules

- target_id must match an [#N] element in the current DOM. Never invent IDs.
- Complete → emit "complete" with summary. Stuck → emit "fail" with reason.
- Keep reasoning to 1-3 sentences tied to visible elements.
- Prefer minimal actions. After a failure, decide: retry or fail.
- Add assertions to verify expected outcomes when useful.

## recreation_prompt

Plain language, no IDs. Reusable even if page changes slightly.
Examples:
- Fill action → "Type 'admin' in the username field"
- Click action → "Click 'Add to cart' on any item"

## JavaScript (execute_js / assert_js_eval)

- Reference elements as {{ID_N}} (replaced with CSS selectors at runtime).
- Don't quote placeholders. Guard against null. Wrap in () => { ... }.
- Assertions return { success: bool, error: string }.
- Only use when no other action type works.
"""

_STEP_ADDENDUM = """
## Mode: Single Step

Emit exactly ONE action or termination. Page is re-observed after execution.
"""

_GROUP_ADDENDUM = """
## Mode: Action Group

Emit actions executable sequentially WITHOUT re-observing between them.

**Group when:** all targets visible+stable, no navigation/re-render, logically related.
**Split when:** action triggers navigation, causes dependent re-renders, or you need to verify first.

Valid: [fill username, fill password, click login] (click is last → triggers nav)
Invalid: [click login, assert url] (assert needs post-nav page → next call)

If done or impossible, emit a single termination signal.
"""
