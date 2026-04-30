from rapidfuzz import fuzz

from .models import NormalizedDOMElement, NormalizedRole, Visibility


class DOMScorer:
    """
    Heuristic scorer for DOM elements.
    """

    INTERACTIVE_BONUS: float = 100
    STATE_FLAG_BONUS: float = 10

    VISIBILITY_SCORES: dict[Visibility, float] = {
        Visibility.IN_VIEWPORT_FULL:    40,
        Visibility.IN_VIEWPORT_PARTIAL: 35,
        Visibility.OUT_OF_VIEWPORT:      0,
        Visibility.HIDDEN:           -1000,
    }

    ROLE_SCORES: dict[NormalizedRole, float] = {
        NormalizedRole.BUTTON:      40,
        NormalizedRole.TEXT_FIELD:  40,
        NormalizedRole.TEXT_AREA:   40,
        NormalizedRole.DROPDOWN:    40,
        NormalizedRole.CHECKBOX:    40,
        NormalizedRole.RADIO:       40,
        NormalizedRole.OPTION:      40,
        NormalizedRole.LINK:        25,

        NormalizedRole.HEADING:     20,
        NormalizedRole.IMAGE:       10,
        NormalizedRole.TEXT:          5,

        NormalizedRole.FORM:        15,
        NormalizedRole.DIALOG:      15,
        NormalizedRole.TABLE:       10,
        NormalizedRole.LIST:         5,
        NormalizedRole.LIST_ITEM:    5,
        NormalizedRole.ROW:          3,
        NormalizedRole.CELL:         5,
        NormalizedRole.GROUP:        0,
    }

    DISPLAY_TEXT_BONUS: float = 20
    VALUE_BONUS: float = 15
    HREF_BONUS: float = 10

    DEPTH_PENALTY_PER_LEVEL: float = -2.0

    INSTRUCTION_MATCH_MULTIPLIER: float = 0.7
    INSTRUCTION_MATCH_CAP: float = 60

    RIPPLE_ALPHA: float = 0.3


    # Public API

    def __init__(
        self,
        viewport_width: int = 1280,
        viewport_height: int = 720,
        instruction: str | None = None
    ) -> None:
        self._instruction = instruction or ""
        self._viewport_width = viewport_width
        self._viewport_height = viewport_height

    def score_tree(self, root: NormalizedDOMElement) -> dict[int, float]:
        """Score all elements, clamp negatives, apply ripple."""
        scores: dict[int, float] = {}
        self._walk(root, scores)
        scores = {
            el_id: max(0.0, score)
            for el_id, score in scores.items()
        }
        scores = self._ripple_scores(root, scores)
        return scores

    # Internals

    def _score_element(self, el: NormalizedDOMElement) -> float:
        """Score a single element in isolation (before ripple)."""
        score: float = 0.0

        match_pct = self._instruction_match(el)
        score += min(
            match_pct * self.INSTRUCTION_MATCH_MULTIPLIER,
            self.INSTRUCTION_MATCH_CAP,
        )

        if el.is_interactive:
            score += self.INTERACTIVE_BONUS
        for flag in (el.is_disabled, el.is_checked, el.is_required, el.is_selected):
            if flag:
                score += self.STATE_FLAG_BONUS

        score += self.VISIBILITY_SCORES.get(el.visibility, 0)

        score += self.ROLE_SCORES.get(el.role, 0)

        if el.display_text:
            score += self.DISPLAY_TEXT_BONUS
        if el.value:
            score += self.VALUE_BONUS
        if el.href:
            score += self.HREF_BONUS

        # Depth
        score += el.depth * self.DEPTH_PENALTY_PER_LEVEL

        return score

    def _instruction_match(self, el: NormalizedDOMElement) -> float:
        """Return 0-100 match against the instruction using merged display text."""
        if not self._instruction:
            return 0.0
        text = el.display_text or ""
        if el.value:
            text = f"{text} {el.value}" if text else el.value
        if not text:
            return 0.0
        return fuzz.token_set_ratio(self._instruction, text)

    def _walk(self, el: NormalizedDOMElement, out: dict[int, float]) -> None:
        out[el.element_id] = self._score_element(el)
        for child in el.children:
            self._walk(child, out)

    def _ripple_scores(self, root: NormalizedDOMElement, scores: dict[int, float]) -> dict[int, float]:
        """Apply a riple effect to the scores using a 2-pass DP."""
        alpha = self.RIPPLE_ALPHA

        dp_down: dict[int, float] = {}
        dp_down_weight: dict[int, float] = {}

        dp_up: dict[int, float] = {}
        dp_up_weight: dict[int, float] = {}

        def dfs_down(el: NormalizedDOMElement) -> None:
            u = el.element_id
            dp_down[u] = scores[el.element_id]
            dp_down_weight[u] = 1.0

            for child in el.children:
                dfs_down(child)
                v = child.element_id

                dp_down[u] += alpha * dp_down[v]
                dp_down_weight[u] += alpha * dp_down_weight[v]

        def dfs_up(el: NormalizedDOMElement) -> None:
            u = el.element_id
            for child in el.children:
                v = child.element_id
                dp_up[v] = (dp_up[u] + dp_down[u] - alpha * dp_down[v]) * alpha
                dp_up_weight[v] = (dp_up_weight[u] + dp_down_weight[u] - alpha * dp_down_weight[v]) * alpha
                dfs_up(child)
        
        dp_up[root.element_id] = 0
        dp_up_weight[root.element_id] = 0.0

        dfs_down(root)
        dfs_up(root)

        result: dict[int, float] = {}

        for el_id in scores:
            total_score = dp_down[el_id] + dp_up[el_id]
            total_weight = dp_down_weight[el_id] + dp_up_weight[el_id]
            if total_weight > 0:
                result[el_id] = total_score / total_weight
            else:
                result[el_id] = scores[el_id]

        return result
