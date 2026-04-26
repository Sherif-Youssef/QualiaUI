from .models import NormalizedDOMElement, PageState
from .heuristic import DOMScorer
from .selector import DOMSelector
from .normalizer import DOMNormalizer
from .config import VerbosityProfile


class PageRenderer:
    """
    Renders a normalized DOM tree into a compact, LLM-friendly text representation.
    """

    INDENT_SIZE: int = 2
    MAX_TEXT_LENGTH: int = 100
    MAX_URL_LENGTH: int = 40
    MAX_TOTAL_CHARS: int = 12000

    def __init__(
        self,
        instruction: str | None = None,
        verbosity_pct: float = 0.8,
    ) -> None:
        profile = VerbosityProfile.from_percentage(verbosity_pct)
        self._instruction = instruction
        self._normalizer: DOMNormalizer = None
        self._scorer: DOMScorer = None
        self._selector: DOMSelector = None
        self._profile = profile

        if profile:
            self.MAX_TOTAL_CHARS = profile.max_total_chars
            self.MAX_TEXT_LENGTH = profile.max_text_length

    def render(self, state: PageState) -> str:
        """
        Render the page state into a text representation.
        """
        self._normalizer = DOMNormalizer()
        self._scorer = DOMScorer(
            viewport_height=state.viewport_height,
            viewport_width=state.viewport_width,
            instruction=self._instruction or "",
        )
        self._selector = DOMSelector(profile=self._profile)
        parts = [
            f"URL: {state.current_url}",
            f"Title: {self._truncate(state.page_title, self.MAX_TEXT_LENGTH)}",
            "",
        ]

        normalized = self._normalizer.normalize_tree(state.root)
        scores = self._scorer.score_tree(normalized)
        selected = self._selector.select(normalized, scores)

        body = self._render_tree(normalized, selected)
        parts.append(body)

        return "\n".join(parts)

    def _render_tree(self, root: NormalizedDOMElement, selected: set[int]) -> str:
        lines: list[str] = []
        chars = 0

        for el in self._walk_selected(root, selected):
            line = self._render_element(el)
            new_chars = chars + len(line) + 1

            if new_chars > self.MAX_TOTAL_CHARS:
                break

            lines.append(line)
            chars = new_chars

        return "\n".join(lines)

    def _render_element(self, el: NormalizedDOMElement) -> str:
        indent = " " * (el.depth * self.INDENT_SIZE)
        parts: list[str] = ["-"]

        # Element ID
        if el.is_interactive:
            parts.append(f"[#{el.element_id}]")

        # Role
        parts.append(el.role.value)

        # Input subtype
        if el.input_subtype:
            parts.append(f"({el.input_subtype})")
        
        # Boolean flags
        if el.is_disabled:
            parts.append("[disabled]")
        if el.is_required:
            parts.append("[required]")
        if el.is_checked:
            parts.append("[checked]")
        if el.is_selected:
            parts.append("[selected]")

        # Display text
        if el.display_text:
            parts.append(f'"{self._truncate(el.display_text, self.MAX_TEXT_LENGTH)}"')

        # Value (separate from display text)
        if el.value:
            parts.append(f'value: "{self._truncate(el.value, self.MAX_TEXT_LENGTH)}"')

        # Href
        if el.href and el.href.strip() not in ("#", "javascript:void(0)"):
            parts.append(f'/url: "{self._truncate(el.href, self.MAX_URL_LENGTH)}"')

        return f"{indent}{' '.join(parts)}"

    @staticmethod
    def _walk_selected(
        el: NormalizedDOMElement,
        selected: set[int],
    ) -> list[NormalizedDOMElement]:
        """In-order traversal returning only selected elements."""
        result: list[NormalizedDOMElement] = []
        
        def collect(el: NormalizedDOMElement) -> None:
            if el.element_id in selected:
                result.append(el)
            for child in el.children:
                collect(child)

        collect(el)

        return result

    @staticmethod
    def _truncate(text: str, max_len: int) -> str:
        if len(text) <= max_len:
            return text
        return text[:max_len-1] + "…"
