from __future__ import annotations

from .models import DOMElement, NormalizedRole, NormalizedDOMElement


class DOMNormalizer:

    
    _INPUT_ROLES: dict[str, NormalizedRole] = {
        "text":           NormalizedRole.TEXT_FIELD,
        "email":          NormalizedRole.TEXT_FIELD,
        "password":       NormalizedRole.TEXT_FIELD,
        "search":         NormalizedRole.TEXT_FIELD,
        "tel":            NormalizedRole.TEXT_FIELD,
        "url":            NormalizedRole.TEXT_FIELD,
        "number":         NormalizedRole.TEXT_FIELD,
        "date":           NormalizedRole.TEXT_FIELD,
        "time":           NormalizedRole.TEXT_FIELD,
        "datetime-local": NormalizedRole.TEXT_FIELD,
        "month":          NormalizedRole.TEXT_FIELD,
        "week":           NormalizedRole.TEXT_FIELD,
        "color":          NormalizedRole.TEXT_FIELD,
        "range":          NormalizedRole.TEXT_FIELD,
        "file":           NormalizedRole.TEXT_FIELD,
        "checkbox":       NormalizedRole.CHECKBOX,
        "radio":          NormalizedRole.RADIO,
        "submit":         NormalizedRole.BUTTON,
        "reset":          NormalizedRole.BUTTON,
        "button":         NormalizedRole.BUTTON,
        "image":          NormalizedRole.BUTTON,
        "hidden":         NormalizedRole.GROUP,
    }

    _TAG_ROLES: dict[str, NormalizedRole] = {
        "button":   NormalizedRole.BUTTON,
        "a":        NormalizedRole.LINK,
        "textarea": NormalizedRole.TEXT_AREA,
        "select":   NormalizedRole.DROPDOWN,
        "option":   NormalizedRole.OPTION,
        "optgroup": NormalizedRole.GROUP,

        "h1": NormalizedRole.HEADING,
        "h2": NormalizedRole.HEADING,
        "h3": NormalizedRole.HEADING,
        "h4": NormalizedRole.HEADING,
        "h5": NormalizedRole.HEADING,
        "h6": NormalizedRole.HEADING,
        "img": NormalizedRole.IMAGE,
        "svg": NormalizedRole.IMAGE,
        "picture": NormalizedRole.IMAGE,

        "p":          NormalizedRole.TEXT,
        "span":       NormalizedRole.TEXT,
        "strong":     NormalizedRole.TEXT,
        "em":         NormalizedRole.TEXT,
        "b":          NormalizedRole.TEXT,
        "i":          NormalizedRole.TEXT,
        "small":      NormalizedRole.TEXT,
        "abbr":       NormalizedRole.TEXT,
        "code":       NormalizedRole.TEXT,
        "pre":        NormalizedRole.TEXT,
        "blockquote": NormalizedRole.TEXT,

        "form":   NormalizedRole.FORM,
        "dialog": NormalizedRole.DIALOG,

        "ul":    NormalizedRole.LIST,
        "ol":    NormalizedRole.LIST,
        "dl":    NormalizedRole.LIST,
        "menu":  NormalizedRole.LIST,
        "li":    NormalizedRole.LIST_ITEM,
        "dd":    NormalizedRole.LIST_ITEM,
        "dt":    NormalizedRole.LIST_ITEM,

        "table":   NormalizedRole.TABLE,
        "thead":   NormalizedRole.GROUP,
        "tbody":   NormalizedRole.GROUP,
        "tfoot":   NormalizedRole.GROUP,
        "tr":      NormalizedRole.ROW,
        "td":      NormalizedRole.CELL,
        "th":      NormalizedRole.CELL,
        "caption": NormalizedRole.TEXT,

        "div":     NormalizedRole.GROUP,
        "section": NormalizedRole.GROUP,
        "main":    NormalizedRole.GROUP,
        "article": NormalizedRole.GROUP,
        "aside":   NormalizedRole.GROUP,
        "header":  NormalizedRole.GROUP,
        "footer":  NormalizedRole.GROUP,
        "nav":     NormalizedRole.GROUP,
        "figure":  NormalizedRole.GROUP,
        "figcaption": NormalizedRole.TEXT,
        "details": NormalizedRole.GROUP,
        "summary": NormalizedRole.TEXT,
        "fieldset": NormalizedRole.GROUP,
        "legend":  NormalizedRole.TEXT,
        "label":   NormalizedRole.TEXT,
        "video":   NormalizedRole.IMAGE,
        "audio":   NormalizedRole.GROUP,
        "iframe":  NormalizedRole.GROUP,
    }

    def normalize_tree(self, root: DOMElement) -> NormalizedDOMElement:
        """Recursively convert a DOMElement tree into a NormalizedDOMElement tree."""
        return self._normalize(root)

    def _normalize(self, el: DOMElement) -> NormalizedDOMElement:
        role = self._resolve_role(el)
        input_subtype = self._resolve_input_subtype(el)

        display_text = self._merge_text(el)
        href = el.attr("href") if role == NormalizedRole.LINK else None
        value = self._extract_value(el, role, display_text)

        return NormalizedDOMElement(
            element_id=el.element_id,
            role=role,
            input_subtype=input_subtype,
            is_interactive=el.is_interactive,
            display_text=display_text,
            href=href,
            value=value,
            is_disabled=el.is_disabled,
            is_required=el.is_required,
            is_checked=el.is_checked,
            is_selected=el.is_selected,
            position=el.position,
            visibility=el.visibility,
            depth=el.depth,
            selector=el.selector,
            children=[self._normalize(child) for child in el.children],
        )

    def _resolve_role(self, el: DOMElement) -> NormalizedRole:
        if el.tag == "input":
            input_type = el.attr("type") or "text"
            return self._INPUT_ROLES.get(input_type, NormalizedRole.TEXT_FIELD)

        return self._TAG_ROLES.get(el.tag, NormalizedRole.GROUP)

    def _resolve_input_subtype(self, el: DOMElement) -> str | None:
        if el.tag != "input":
            return None

        input_type = el.attr("type") or "text"
        role = self._INPUT_ROLES.get(input_type, NormalizedRole.TEXT_FIELD)

        if role != NormalizedRole.TEXT_FIELD:
            return None

        # 'text' is the default, no need to annotate
        if input_type == "text":
            return None

        return input_type

    def _merge_text(self, el: DOMElement) -> str | None:
        """
        Merge all human-visible text signals into a single display string.
        """
        text = self._clean(el.text)
        aria_label = self._clean(el.attr("aria-label"))
        alt = self._clean(el.attr("alt"))
        placeholder = self._clean(el.attr("placeholder"))

        parts: list[str] = []

        # Primary text
        if text:
            parts.append(text)

        # aria-label only if it adds information beyond text
        if aria_label and not self._is_redundant(aria_label, parts):
            parts.append(aria_label)

        # alt for images, or when no other text exists
        if alt and not self._is_redundant(alt, parts):
            parts.append(alt)

        # placeholder only when there's no value currently entered
        if placeholder and not el.attr("value"):
            if not self._is_redundant(placeholder, parts):
                parts.append(placeholder)

        if not parts:
            return None

        return " - ".join(parts)

    def _extract_value(self, el: DOMElement, role: NormalizedRole, display_text: str | None) -> str | None:
        """
        Extract the current value for form controls.
        """
        raw = self._clean(el.attr("value"))
        if not raw:
            return None

        # Only relevant for form controls
        if role not in {
            NormalizedRole.TEXT_FIELD,
            NormalizedRole.TEXT_AREA,
            NormalizedRole.DROPDOWN,
            NormalizedRole.OPTION,
            NormalizedRole.CHECKBOX,
            NormalizedRole.RADIO,
        }:
            return None

        # Skip if already shown in display text
        if display_text and raw.lower() in display_text.lower():
            return None

        return raw

    def _clean(self, val: str | None) -> str | None:
        """Strip and return None for empty strings."""
        if not val:
            return None
        val = val.strip()
        return val if val else None

    def _is_redundant(self, candidate: str, existing: list[str]) -> bool:
        """
        True if the candidate is a substring of any existing part
        or any existing part is a substring of the candidate.
        """
        c = candidate.lower()
        for part in existing:
            p = part.lower()
            if c in p or p in c:
                return True
        return False
