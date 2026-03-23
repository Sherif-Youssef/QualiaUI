from pathlib import Path
from .rendering import (
    HistoryRenderer,
    HistoryRendererConfig,
    DOMRenderer,
    DOMRendererConfig,
)


def get_js_serializer_path() -> Path:
    return Path(__file__).parent.resolve() / "js" / "assets" / "dom_serializer.bundle.js"


def get_js_serializer_code() -> str:
    return get_js_serializer_path().read_text()


def get_js_serializer_api_code() -> str:
    return "window.getSimplifiedDOMInJSON()"


__all__ = [
    "get_js_serializer_path",
    "get_js_serializer_code",
    "get_js_serializer_api_code",
    "DOMRenderer",
    "DOMRendererConfig",
    "HistoryRenderer",
    "HistoryRendererConfig",
]
