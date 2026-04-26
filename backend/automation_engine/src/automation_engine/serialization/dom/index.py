from .models import DOMElement, Visibility


class DOMIndex:
    """
    Flattened, O(1)-lookup view over a DOMElement tree.
    """

    __slots__ = ("_by_id",)

    def __init__(self, root: DOMElement) -> None:
        self._by_id: dict[int, DOMElement] = {}
        self._trav(root)

    def _trav(self, node: DOMElement) -> None:
        self._by_id[node.element_id] = node
        for child in node.children:
            self._trav(child)

    def __getitem__(self, element_id: int) -> DOMElement:
        return self._by_id[element_id]

    def get(self, element_id: int) -> DOMElement | None:
        return self._by_id.get(element_id)

    def selector(self, element_id: int) -> str:
        """Shortcut: element_id -> CSS selector."""
        return self[element_id].selector

    def __contains__(self, element_id: int) -> bool:
        return element_id in self._by_id

    def __len__(self) -> int:
        return len(self._by_id)

    @property
    def all_elements(self) -> list[DOMElement]:
        return list(self._by_id.values())

    @property
    def interactive_elements(self) -> list[DOMElement]:
        return [el for el in self._by_id.values() if el.is_interactive]

    @property
    def visible_elements(self, fully: bool = False) -> list[DOMElement]:
        if fully:
            visibility_filter = (Visibility.IN_VIEWPORT_FULL,)
        else:
            visibility_filter = (Visibility.IN_VIEWPORT_FULL, Visibility.IN_VIEWPORT_PARTIAL)
        return [
            el for el in self._by_id.values()
            if el.visibility in visibility_filter
        ]
