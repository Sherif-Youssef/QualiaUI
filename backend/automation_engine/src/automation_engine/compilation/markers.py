from __future__ import annotations


class FieldMarker:
    ...


class SourcedFrom(FieldMarker):
    def __init__(self, source: str):
        self.source = source


class ElementRef(FieldMarker):
    ...


class TextResolvable(FieldMarker):
    ...


class FileVarRef(FieldMarker):
    ...


class JSResolvable(FieldMarker):
    ...
