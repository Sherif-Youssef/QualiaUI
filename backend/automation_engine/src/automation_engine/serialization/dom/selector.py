from .models import NormalizedDOMElement
from .config import VerbosityProfile


class DOMSelector:
    """
    Selects which DOM nodes to render based on scored importance.
    """

    MIN_NODES: int = 50
    NODE_PERC: float = None

    def __init__(self, profile: VerbosityProfile | None = None) -> None:
        if profile:
            self.MIN_NODES = profile.min_nodes
            self.NODE_PERC = profile.node_perc

    def select(
        self,
        root: NormalizedDOMElement,
        scores: dict[int, float],
    ) -> set[int]:
        """
        Return the set of element IDs to render.
        """
        parents = self._build_parent_map(root)
        candidates = sorted(scores, key=scores.get, reverse=True)
        selected: set[int] = set()
        remaining = self._get_selected_count(len(candidates))

        for el_id in candidates:
            new_ancestors = self._new_ancestors(el_id, parents, selected)
            cost = 1 + len(new_ancestors)

            if cost > remaining:
                break

            selected.add(el_id)
            selected.update(new_ancestors)
            remaining -= cost
        
        return selected
    
    def _get_selected_count(self, total: int) -> int:
        perc_value = int(self.NODE_PERC * total) if self.NODE_PERC else 0
        return max(perc_value, self.MIN_NODES)

    @staticmethod
    def _build_parent_map(root: NormalizedDOMElement) -> dict[int, int | None]:
        """Return ``{element_id: parent_element_id}`` for every node."""
        parents: dict[int, int | None] = {root.element_id: None}

        stack = [root]
        while stack:
            node = stack.pop()
            for child in node.children:
                parents[child.element_id] = node.element_id
                stack.append(child)

        return parents

    @staticmethod
    def _new_ancestors(
        eid: int,
        parents: dict[int, int | None],
        selected: set[int],
    ) -> list[int]:
        """Return ancestor IDs of ``eid`` that are not yet selected."""
        new: list[int] = []
        current = parents.get(eid)
        while current is not None:
            if current in selected:
                break
            new.append(current)
            current = parents.get(current)
        return new
