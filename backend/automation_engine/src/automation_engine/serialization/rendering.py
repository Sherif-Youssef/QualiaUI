from __future__ import annotations

from enum import StrEnum
from pydantic import BaseModel, ConfigDict

from ..planning.state import DOMElement, BrowserState
from ..testing.history import TestRun, TestStep


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


class HistoryRendererConfig(BaseModel):
    model_config = ConfigDict(frozen=True)

    include_status: bool = False
    include_error: bool = True
    max_actions: int | None = None


# Renderers

class DOMRenderer:
    """
    Renders a DOM tree into a compact, LLM-friendly string.
    Separate from the data model so you can swap strategies.
    """

    def __init__(self, config: DOMRendererConfig | None = None) -> None:
        self.config = config or DOMRendererConfig()

    def render_browser_state(self, state: BrowserState) -> str:
        lines = [
            f"Current URL: {state.current_url}",
            f"Page title: {state.page_title}",
            f"viewport: {state.viewport_width}x{state.viewport_height}",
            "DOM:",
            self.render_element(state.root),
        ]
        
        return "\n".join(lines)

    def render_element(self, element: DOMElement) -> str:
        lines: list[str] = []
        self._render(element, depth=0, lines=lines)
        return "\n".join(lines)

    def _render(
        self,
        el: DOMElement,
        depth: int,
        lines: list[str],
    ) -> None:
        cfg = self.config
        prefix = " " * (depth * cfg.indent_size)
        parts: list[str] = []
        secondary: list[str] = []

        # 1. ID (# prefix for interactive)
        marker = "#" if el.is_interactive else ""
        parts.append(f"[{marker}{el.element_id}]")

        # 2. Tag + visibility
        parts.append(el.tag)
        parts.append(f"({el.visibility})")

        # 3. Core identity attributes
        self._append_attr(parts, el, "id")
        self._append_attr(parts, el, "name")
        self._append_attr(parts, el, "type")

        # 4. Navigation attributes (truncated)
        self._append_truncated_attr(parts, el, "href", cfg.max_url_length)
        self._append_truncated_attr(parts, el, "src", cfg.max_url_length)

        # 5. State flags
        if el.is_disabled:
            parts.append("DISABLED")
        if el.is_required:
            parts.append("REQUIRED")
        if el.is_checked:
            parts.append("CHECKED")

        # 6. Value
        self._append_quoted_attr(parts, el, "value", cfg.max_value_length)

        # 7. Text content
        if el.text:
            text = self._truncate(el.text, cfg.max_text_length)
            parts.append(f'text="{text}"')

        # standard verbosity
        if cfg.verbosity in (Verbosity.STANDARD, Verbosity.FULL):
            self._append_quoted_attr(secondary, el, "placeholder", cfg.max_attr_length)
            self._append_quoted_attr(secondary, el, "alt", cfg.max_attr_length)
            self._append_quoted_attr(secondary, el, "aria-label", cfg.max_attr_length)
            self._append_attr(secondary, el, "aria-describedby")

        # full verbosity
        if cfg.verbosity == Verbosity.FULL:
            # dataset
            dataset = el.attributes.get("dataset")
            if isinstance(dataset, dict):
                for key, value in dataset.items():
                    trunc = self._truncate(value, cfg.max_value_length)
                    secondary.append(f'data-{key}="{trunc}"')

            self._append_attr(secondary, el, "role")
            self._append_quoted_attr(secondary, el, "class", cfg.max_attr_length)

        # optional sections
        if cfg.show_position:
            pos = el.position
            secondary.append(
                f"pos=({pos.x},{pos.y}) size={pos.width}x{pos.height}"
            )

        if cfg.show_selector:
            sel = self._truncate(el.selector, cfg.max_url_length)
            secondary.append(f"selector={sel}")

        #  write lines
        lines.append(f"{prefix}{' '.join(parts)}")

        if secondary:
            sub_prefix = prefix + " " * cfg.indent_size
            for info in secondary:
                lines.append(f"{sub_prefix}{info}")

        # recurse children
        for child in el.children:
            self._render(child, depth + 1, lines)

    # helpers
    @staticmethod
    def _truncate(text: str, max_len: int) -> str:
        if len(text) > max_len:
            return text[: max_len - 3] + "..."
        return text

    def _append_attr(
        self,
        parts: list[str],
        el: DOMElement,
        name: str,
    ) -> None:
        val = el.attr(name)
        if val:
            parts.append(f"{name}={val}")

    def _append_truncated_attr(
        self,
        parts: list[str],
        el: DOMElement,
        name: str,
        max_len: int,
    ) -> None:
        val = el.attr(name)
        if val:
            parts.append(f"{name}={self._truncate(val, max_len)}")

    def _append_quoted_attr(
        self,
        parts: list[str],
        el: DOMElement,
        name: str,
        max_len: int,
    ) -> None:
        val = el.attr(name)
        if val:
            parts.append(f'{name}="{self._truncate(val, max_len)}"')


class HistoryRenderer:
    """Renders test history into LLM-friendly strings."""

    def __init__(self, config: HistoryRendererConfig | None = None) -> None:
        self.config = config or HistoryRendererConfig()

    def render_history(self, run: TestRun) -> str:
        steps = run.current_group.steps if run.current_group else []
        if not steps:
            return "No actions taken yet."

        cfg = self.config
        if cfg.max_actions is not None:
            steps = steps[-cfg.max_actions:]

        lines: list[str] = []

        lines.append(f"Last {len(steps)} actions, starting from oldest, line by line:")
        for step in steps:
            lines.append(self._render_step(step))

        return "\n".join(lines)

    def _render_step(self, step: TestStep) -> str:
        cfg = self.config

        parts = [
            f"[{step.index}]",
            f"[{step.status.upper()}]" if cfg.include_status else "",
            step.action.action_type,
            "-",
            step.action.recreation_prompt,
            f"(Error: {step.error_message})" if cfg.include_error and step.error_message else "",
        ]

        return " ".join(parts)
