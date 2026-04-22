from __future__ import annotations

from enum import StrEnum
from pydantic import BaseModel, ConfigDict

from ..planning.state import DOMElement, BrowserState, Visibility
from ..testing.history import TestRun, TestStep


# Visibility shortcodes

_VISIBILITY_LABEL: dict[Visibility, str] = {
    Visibility.IN_VIEWPORT_FULL: "",
    Visibility.IN_VIEWPORT_PARTIAL: "[partial]",
    Visibility.OUT_OF_VIEWPORT: "[offscreen]",
    Visibility.HIDDEN: "[hidden]",
}


# Config

class Verbosity(StrEnum):
    MINIMAL = "minimal"
    STANDARD = "standard"
    FULL = "full"


class DOMRendererConfig(BaseModel):
    model_config = ConfigDict(frozen=True)

    verbosity: Verbosity = Verbosity.STANDARD
    indent_size: int = 2
    show_selector: bool = False
    show_position: bool = False
    max_text_length: int = 2000
    max_value_length: int = 30
    max_url_length: int = 50
    max_attr_length: int = 40
    # Filtering
    skip_hidden: bool = True
    collapse_empty_containers: bool = True


class HistoryRendererConfig(BaseModel):
    model_config = ConfigDict(frozen=True)

    include_status: bool = False
    include_error: bool = True
    max_actions: int | None = None


# DOM Renderer

class DOMRenderer:
    """
    Renders a DOM tree into a compact, LLM-friendly text representation.

    Design principles:
      • Interactive elements are prefixed with ``#`` so the LLM can
        immediately see what is actionable.
      • Only *non-default* visibility is annotated (fully-visible elements
        carry no tag → fewer tokens).
      • Hidden elements are skipped by default.
      • Empty non-interactive wrapper nodes are collapsed to avoid deep
        nesting noise.
      • Attributes are ordered by descending relevance: identity → navigation
        → state → value → text → accessibility → data.
    """

    __slots__ = ("config",)

    def __init__(self, config: DOMRendererConfig | None = None) -> None:
        self.config = config or DOMRendererConfig()

    # Public API

    def render_browser_state(self, state: BrowserState) -> str:
        parts = [
            f"URL: {state.current_url}",
            f"Title: {state.page_title}",
            f"Viewport: {state.viewport_width}×{state.viewport_height}",
            "",
            "Interactive elements are prefixed with #.",
            "",
            self.render_element(state.root),
        ]
        return "\n".join(parts)

    def render_element(self, element: DOMElement) -> str:
        lines: list[str] = []
        self._render(element, depth=0, lines=lines)
        return "\n".join(lines)

    # Recursive renderer

    def _render(
        self,
        el: DOMElement,
        depth: int,
        lines: list[str],
    ) -> None:
        cfg = self.config

        # Filtering
        if cfg.skip_hidden and el.visibility == Visibility.HIDDEN:
            return

        # Collapse: skip non-interactive wrappers that carry no text/value
        if cfg.collapse_empty_containers and self._is_empty_container(el):
            for child in el.children:
                self._render(child, depth, lines)
            return

        indent = " " * (depth * cfg.indent_size)

        # Primary tokens (always shown)
        primary: list[str] = []

        # Element id – '#' prefix marks interactive targets
        id_prefix = "#" if el.is_interactive else ""
        primary.append(f"[{id_prefix}{el.element_id}]")

        # Tag
        primary.append(el.tag)

        # Visibility – only annotate when *not* fully visible
        vis_label = _VISIBILITY_LABEL.get(el.visibility, "")
        if vis_label:
            primary.append(vis_label)

        # Identity attrs
        self._push_attr(primary, el, "id")
        self._push_attr(primary, el, "name")
        self._push_attr(primary, el, "type")

        # Navigation attrs (truncated)
        self._push_attr(primary, el, "href", max_len=cfg.max_url_length)
        self._push_attr(primary, el, "src", max_len=cfg.max_url_length)

        # Boolean state flags
        for flag, label in (
            (el.is_disabled, "DISABLED"),
            (el.is_required, "REQUIRED"),
            (el.is_checked, "CHECKED"),
        ):
            if flag:
                primary.append(label)

        # Value
        self._push_quoted(primary, el, "value", max_len=cfg.max_value_length)

        # Text content
        if el.text:
            primary.append(f'"{_truncate(el.text, cfg.max_text_length)}"')

        lines.append(f"{indent}{' '.join(primary)}")

        # Secondary tokens (verbosity-gated, indented below)
        if cfg.verbosity in (Verbosity.STANDARD, Verbosity.FULL):
            secondary: list[str] = []
            for attr in ("placeholder", "alt", "aria-label"):
                self._push_quoted(secondary, el, attr, max_len=cfg.max_attr_length)
            self._push_attr(secondary, el, "aria-describedby")

            if cfg.verbosity == Verbosity.FULL:
                self._push_attr(secondary, el, "role")
                self._push_quoted(secondary, el, "class", max_len=cfg.max_attr_length)
                self._push_dataset(secondary, el, max_len=cfg.max_value_length)

            if cfg.show_position:
                p = el.position
                secondary.append(f"pos=({p.x},{p.y}) size={p.width}×{p.height}")

            if cfg.show_selector:
                secondary.append(f"sel={_truncate(el.selector, cfg.max_url_length)}")

            if secondary:
                sub = indent + " " * cfg.indent_size
                for tok in secondary:
                    lines.append(f"{sub}{tok}")

        # Children
        for child in el.children:
            self._render(child, depth + 1, lines)

    # Helpers

    @staticmethod
    def _is_empty_container(el: DOMElement) -> bool:
        """True for non-interactive wrapper nodes that carry no user-facing content."""
        if el.is_interactive:
            return False
        if el.text:
            return False
        if el.attributes.get("value"):
            return False
        return bool(el.children)

    @staticmethod
    def _push_attr(
        parts: list[str],
        el: DOMElement,
        name: str,
        *,
        max_len: int = 0,
    ) -> None:
        val = el.attr(name)
        if not val:
            return
        if max_len:
            val = _truncate(val, max_len)
        parts.append(f"{name}={val}")

    @staticmethod
    def _push_quoted(
        parts: list[str],
        el: DOMElement,
        name: str,
        *,
        max_len: int,
    ) -> None:
        val = el.attr(name)
        if val:
            parts.append(f'{name}="{_truncate(val, max_len)}"')

    @staticmethod
    def _push_dataset(
        parts: list[str],
        el: DOMElement,
        *,
        max_len: int,
    ) -> None:
        dataset = el.attributes.get("dataset")
        if isinstance(dataset, dict):
            for key, value in dataset.items():
                parts.append(f'data-{key}="{_truncate(value, max_len)}"')


# History Renderer

class HistoryRenderer:
    """Renders past test actions into a compact LLM-friendly summary."""

    __slots__ = ("config",)

    def __init__(self, config: HistoryRendererConfig | None = None) -> None:
        self.config = config or HistoryRendererConfig()

    def render_history(self, run: TestRun) -> str:
        steps = run.current_group.steps if run.current_group else []
        if not steps:
            return "No actions taken yet."

        cfg = self.config
        if cfg.max_actions is not None:
            steps = steps[-cfg.max_actions:]

        header = f"Previous {len(steps)} action(s) (oldest → newest):"
        body = "\n".join(self._render_step(s) for s in steps)
        return f"{header}\n{body}"

    def _render_step(self, step: TestStep) -> str:
        cfg = self.config
        parts: list[str] = [f"  {step.index}."]

        if cfg.include_status and step.status:
            parts.append(f"[{step.status.upper()}]")

        parts.append(step.action.action_type)
        parts.append("—")
        parts.append(step.action.recreation_prompt)

        if cfg.include_error and step.error_message:
            parts.append(f"⚠ {step.error_message}")

        return " ".join(parts)


# Module-level utility

def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 1] + "…"
