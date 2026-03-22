from __future__ import annotations

import re

from ..planning.state import DOMIndex


_PLACEHOLDER_RE = re.compile(r"\{ID_(\d+)\}")


def resolve_js_placeholders(code: str, index: DOMIndex) -> str:
    """
    Replace {ID_N} placeholders with quoted CSS selectors.
    e.g. document.querySelector({ID_4})  →  document.querySelector("[data-sid='4']")
    """

    def _replace(match: re.Match) -> str:
        element_id = int(match.group(1))
        selector = index.selector(element_id)
        return f"'{selector}'"

    return _PLACEHOLDER_RE.sub(_replace, code)
