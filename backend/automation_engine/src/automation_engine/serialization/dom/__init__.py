from pathlib import Path
from .models import DOMElement, PageState, Visibility
from .renderer import PageRenderer
from .index import DOMIndex


def get_js_serializer_path() -> Path:
    p = Path(__file__).parent.resolve() / "js" / "assets" / "dom_serializer.bundle.js"
    if not p.exists():
        # Fallback to absolute source path if in Docker dev environment (/app is standard)
        docker_fallback = Path("/app/automation_engine/src/automation_engine/serialization/dom/js/assets/dom_serializer.bundle.js")
        if docker_fallback.exists():
            return docker_fallback
    return p


def get_js_serializer_code() -> str:
    return get_js_serializer_path().read_text()


def get_js_serializer_api_code() -> str:
    return "window.getSimplifiedDOMInJSON()"


__all__ = [
    "DOMElement",
    "PageState",
    "Visibility",
    "PageRenderer",
    "DOMIndex",
    "get_js_serializer_path",
    "get_js_serializer_code",
    "get_js_serializer_api_code",
]
