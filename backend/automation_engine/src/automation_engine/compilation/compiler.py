"""
Maps action models → executable action models.
Resolves element IDs to CSS selectors, transforms fields to match
PlaywrightBrowser method signatures.
"""

from __future__ import annotations

import re
import inspect
from typing import Type, Callable, get_type_hints

from ..planning.state import DOMIndex
from ..actions.base import BaseAction
from ..actions.interactions import (
    Waiting, Click, Fill, Hover, SelectOption,
    Press, Focus, Navigate, Scroll, DragDrop,
    UploadFile, ExecuteJS,
)
from ..actions.assertions import (
    AssertState, AssertTextRegex, AssertChecked,
    AssertElementCount, AssertJSEval,
)
from .executable_actions import (
    ExecAction,
    WaitingExec, ClickExec, FillExec, HoverExec,
    SelectOptionExec, PressExec, FocusExec, NavigateExec,
    ScrollExec, DragDropExec, UploadFileExec, ExecuteJSExec,
    AssertStateExec, AssertTextRegexExec, AssertCheckedExec,
    AssertElementCountExec, AssertJSEvalExec,
)
from .utils import resolve_js_placeholders


class ActionCompiler:
    """Translates action models into executable action models by resolving
    element IDs to CSS selectors and transforming fields."""

    _dispatch: dict[Type[BaseAction], Callable] = None

    @classmethod
    def build_dispatch(cls) -> None:
        cls._dispatch = {}
        for _, member in inspect.getmembers(cls, predicate=inspect.isfunction):
            hints = get_type_hints(member)
            if "action" not in hints:
                continue
            action_type = hints["action"]
            if action_type and issubclass(action_type, BaseAction) and member is not BaseAction:
                cls._dispatch[action_type] = member

    def __init__(self, index: DOMIndex) -> None:
        self._index = index

    def compile(self, action: BaseAction) -> ExecAction:
        handler = self._dispatch.get(type(action))
        if handler is None:
            raise NotImplementedError(f"No compiler for {type(action).__name__}")
        return handler(self, action)

    # helpers

    def _sel(self, element_id: int) -> str:
        return self._index.selector(element_id)

    def _resolve_js(self, code: str) -> str:
        return resolve_js_placeholders(code, self._index)

    # interactions

    def _waiting(self, action: Waiting) -> WaitingExec:
        return WaitingExec(timeout=action.timeout or 1000)

    def _click(self, action: Click) -> ClickExec:
        return ClickExec(
            target_selector=self._sel(action.target_id),
            button=action.button,
            click_count=action.click_count,
            modifiers=action.modifiers or None,
            timeout=action.timeout,
        )

    def _fill(self, action: Fill) -> FillExec:
        return FillExec(
            target_selector=self._sel(action.target_id),
            value=action.value,
            clear_first=action.clear_first,
            timeout=action.timeout,
        )

    def _hover(self, action: Hover) -> HoverExec:
        return HoverExec(
            target_selector=self._sel(action.target_id),
            timeout=action.timeout,
        )

    def _select_option(self, action: SelectOption) -> SelectOptionExec:
        value = action.value
        label = action.label
        index = action.index

        if action.option_element_id is not None:
            option_el = self._index[action.option_element_id]
            option_value = option_el.attr("value")
            if option_value is not None:
                value = option_value
            else:
                label = option_el.text or ""

        return SelectOptionExec(
            target_selector=self._sel(action.select_element_id),
            value=value,
            label=label,
            index=index,
            timeout=action.timeout,
        )

    def _press(self, action: Press) -> PressExec:
        return PressExec(
            key="+".join(action.key_strokes),
            selector=self._sel(action.target_id) if action.target_id else None,
            timeout=action.timeout,
        )

    def _focus(self, action: Focus) -> FocusExec:
        return FocusExec(
            target_selector=self._sel(action.target_id),
            timeout=action.timeout,
        )

    def _navigate(self, action: Navigate) -> NavigateExec:
        return NavigateExec(
            url=action.url,
            wait_until=action.wait_until,
            timeout=action.timeout,
        )

    def _scroll(self, action: Scroll) -> ScrollExec:
        return ScrollExec(
            target_selector=self._sel(action.target_id),
            timeout=action.timeout,
        )

    def _drag_drop(self, action: DragDrop) -> DragDropExec:
        return DragDropExec(
            source_selector=self._sel(action.source_id),
            target_selector=self._sel(action.target_id),
            timeout=action.timeout,
        )

    def _upload_file(self, action: UploadFile) -> UploadFileExec:
        return UploadFileExec(
            target_selector=self._sel(action.target_id),
            files=action.file_paths,
            timeout=action.timeout,
        )

    def _execute_js(self, action: ExecuteJS) -> ExecuteJSExec:
        return ExecuteJSExec(expression=self._resolve_js(action.code))

    # assertions

    def _assert_state(self, action: AssertState) -> AssertStateExec:
        return AssertStateExec(
            target_selector=self._sel(action.target_id),
            state=action.state,
            negated=action.negated,
            timeout=action.timeout,
        )

    def _assert_text_regex(self, action: AssertTextRegex) -> AssertTextRegexExec:
        return AssertTextRegexExec(
            target_selector=self._sel(action.target_id) if action.target_type is None else None,
            target_type=action.target_type,
            pattern=re.compile(action.pattern),
            timeout=action.timeout,
        )

    def _assert_checked(self, action: AssertChecked) -> AssertCheckedExec:
        return AssertCheckedExec(
            target_selector=self._sel(action.target_id),
            checked=action.checked,
            timeout=action.timeout,
        )

    def _assert_element_count(self, action: AssertElementCount) -> AssertElementCountExec:
        return AssertElementCountExec(
            target_selector=self._sel(action.target_id),
            expected_count=action.expected_count,
            comparison=action.comparison,
            timeout=action.timeout,
        )

    def _assert_js_eval(self, action: AssertJSEval) -> AssertJSEvalExec:
        return AssertJSEvalExec(
            expression=self._resolve_js(action.code),
            arg=self._sel(action.target_id) if action.target_id is not None else None,
        )


ActionCompiler.build_dispatch()
