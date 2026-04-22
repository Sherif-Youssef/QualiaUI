from __future__ import annotations

import re
import inspect
from pathlib import Path
from typing import Any, Literal, Type, Callable

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    Playwright,
    Error as PlaywrightError,
    expect,
)

from ..compilation.executable_actions import (
    ExecAction,
    WaitingExec, ClickExec, FillExec, HoverExec,
    SelectOptionExec, PressExec, NavigateExec,
    ScrollExec, DragDropExec, UploadFileExec, ExecuteJSExec,
    AssertStateExec, AssertTextRegexExec, AssertCheckedExec,
    AssertElementCountExec, AssertJSEvalExec, AssertTextExec
)


class PlaywrightBrowser:
    """
    Thin async interface over a single Playwright page.
    Action method signatures match *Exec model fields so callers can do:
        await browser.<method>(**exec_action.model_dump())
    """

    _dispatch: dict[Type[ExecAction], Callable] = None

    @staticmethod
    def register_action(action_type: Type[ExecAction]):
        def decorator(func: Callable):
            func._action_type = action_type
            return func
        return decorator

    @classmethod
    def build_dispatch(cls) -> None:
        cls._dispatch = {}
        for _, member in inspect.getmembers(cls, predicate=inspect.isfunction):
            if not hasattr(member, "_action_type"):
                continue
            action_type = member._action_type
            assert issubclass(action_type, ExecAction) and member not in cls._dispatch
            cls._dispatch[action_type] = member
            delattr(member, "_action_type")

    def __init__(
        self,
        headless: bool = False,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
        default_timeout: float | None = None,
    ) -> None:
        self._headless = headless
        self._viewport_width = viewport_width
        self._viewport_height = viewport_height
        self._default_timeout = default_timeout

        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None

    async def start(
        self,
        url: str | None = None,
        init_scripts: list[str | Path] | None = None,
    ) -> None:
        if self._playwright is not None:
            raise RuntimeError("Browser already started.")

        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(headless=self._headless)
        self._context = await self._browser.new_context(
            viewport={"width": self._viewport_width, "height": self._viewport_height},
        )

        if self._default_timeout is not None:
            self._context.set_default_timeout(self._default_timeout)

        for script in init_scripts or []:
            if isinstance(script, Path):
                await self._context.add_init_script(path=script)
            else:
                await self._context.add_init_script(script)

        self._page = await self._context.new_page()

        if url is not None:
            await self._page.goto(url)

    async def close(self) -> None:
        if self._page:
            await self._page.close()
            self._page = None
        if self._context:
            await self._context.close()
            self._context = None
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

    @property
    def page(self) -> Page:
        if self._page is None:
            raise RuntimeError("Browser not started.")
        return self._page

    @property
    def url(self) -> str:
        return self.page.url

    @property
    def viewport_width(self) -> int:
        return self._viewport_width

    @property
    def viewport_height(self) -> int:
        return self._viewport_height

    async def title(self) -> str:
        return await self.page.title()

    async def go_back(self, *, timeout: float | None = None) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        await self.page.go_back(**kwargs)

    async def go_forward(self, *, timeout: float | None = None) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        await self.page.go_forward(**kwargs)

    async def reload(self, *, timeout: float | None = None) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        await self.page.reload(**kwargs)

    async def wait_for_load_state(
        self,
        state: Literal["domcontentloaded", "load", "networkidle"] = "domcontentloaded",
    ) -> None:
        await self.page.wait_for_load_state(state)

    async def wait_for_selector(
        self,
        selector: str,
        *,
        state: Literal["attached", "detached", "hidden", "visible"] = "visible",
        timeout: float | None = None,
    ) -> None:
        kwargs: dict = {"state": state}
        if timeout is not None:
            kwargs["timeout"] = timeout
        await self.page.wait_for_selector(selector, **kwargs)

    async def wait_for_function(
        self,
        expression: str,
        *,
        timeout: float | None = None,
    ) -> Any:
        kwargs = {"timeout": timeout} if timeout else {}
        return await self.page.wait_for_function(expression, **kwargs)

    async def screenshot(self) -> bytes:
        return await self.page.screenshot(type="png")

    # Dispatch

    async def execute(self, action: ExecAction) -> Any:
        handler = self._dispatch.get(type(action))
        if handler is None:
            raise NotImplementedError(f"No compiler for {type(action).__name__}")
        return await handler(self, **action.to_exec_kwargs())

    # Interactions

    @register_action(WaitingExec)
    async def wait_for_timeout(self, *, timeout: float = 1000) -> None:
        await self.page.wait_for_timeout(timeout)

    @register_action(ClickExec)
    async def click(
        self,
        *,
        target_selector: str,
        button: Literal["left", "middle", "right"] = "left",
        click_count: int = 1,
        modifiers: list[Literal["Alt", "ControlOrMeta", "Shift"]] | None = None,
        timeout: float | None = None,
    ) -> None:
        kwargs: dict = {"button": button, "click_count": click_count}
        if modifiers:
            kwargs["modifiers"] = modifiers
        if timeout is not None:
            kwargs["timeout"] = timeout
        await self.page.click(target_selector, **kwargs)

    @register_action(FillExec)
    async def fill(
        self,
        *,
        target_selector: str,
        value: str,
        clear_first: bool = True,
        timeout: float | None = None,
    ) -> None:
        locator = self.page.locator(target_selector)
        kwargs = {"timeout": timeout} if timeout else {}
        if clear_first:
            await locator.clear(**kwargs)
        await locator.fill(value, **kwargs)

    @register_action(HoverExec)
    async def hover(
        self,
        *,
        target_selector: str,
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        await self.page.locator(target_selector).hover(**kwargs)

    @register_action(SelectOptionExec)
    async def select_option(
        self,
        *,
        target_selector: str,
        value: str | None = None,
        label: str | None = None,
        index: int | None = None,
        timeout: float | None = None,
    ) -> None:
        kwargs: dict = {}
        if value is not None:
            kwargs["value"] = value
        elif label is not None:
            kwargs["label"] = label
        elif index is not None:
            kwargs["index"] = index
        else:
            raise ValueError("Provide at least one of: value, label, index.")
        if timeout is not None:
            kwargs["timeout"] = timeout
        await self.page.locator(target_selector).select_option(**kwargs)

    @register_action(PressExec)
    async def press(
        self,
        *,
        key: str,
        selector: str | None = None,
        timeout: float | None = None,
    ) -> None:
        if selector is not None:
            kwargs = {"timeout": timeout} if timeout else {}
            await self.page.locator(selector).press(key, **kwargs)
        else:
            await self.page.keyboard.press(key)

    @register_action(NavigateExec)
    async def goto(
        self,
        *,
        url: str,
        wait_until: Literal["commit", "domcontentloaded", "load", "networkidle"] = "load",
        timeout: float | None = None,
    ) -> None:
        kwargs: dict = {"wait_until": wait_until}
        if timeout is not None:
            kwargs["timeout"] = timeout
        await self.page.goto(url, **kwargs)

    @register_action(ScrollExec)
    async def scroll_into_view(
        self,
        *,
        target_selector: str,
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        await self.page.locator(target_selector).scroll_into_view_if_needed(**kwargs)

    @register_action(DragDropExec)
    async def drag_to(
        self,
        *,
        source_selector: str,
        target_selector: str,
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        source = self.page.locator(source_selector)
        target = self.page.locator(target_selector)
        await source.drag_to(target, **kwargs)

    @register_action(UploadFileExec)
    async def set_input_files(
        self,
        *,
        target_selector: str,
        files: list[Path],
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        await self.page.locator(target_selector).set_input_files(files, **kwargs)

    @register_action(ExecuteJSExec)
    async def evaluate_js(
        self,
        *,
        code: str,
        arg: Any = None,
    ) -> Any:
        try:
            return await self.page.evaluate(code, arg)
        except PlaywrightError as e:
            if "Execution context was destroyed" not in str(e):
                raise
            return None

    # Assertions

    @register_action(AssertStateExec)
    async def expect_state(
        self,
        *,
        target_selector: str,
        state: str,
        negated: bool = False,
        timeout: float | None = None,
    ) -> None:
        locator = self.page.locator(target_selector)
        kwargs = {"timeout": timeout} if timeout else {}

        if state == "readonly":
            method = "to_be_editable" if negated else "not_to_be_editable"
        else:
            base = f"to_be_{state}"
            method = base.replace("to_be_", "not_to_be_") if negated else base

        await getattr(expect(locator), method)(**kwargs)

    @register_action(AssertTextRegexExec)
    async def expect_text_regex(
        self,
        *,
        target_selector: str | None = None,
        target_type: str | None = None,
        pattern: str,
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        pattern = re.compile(pattern)

        if target_type == "title":
            await expect(self.page).to_have_title(pattern, **kwargs)
        elif target_type == "url":
            await expect(self.page).to_have_url(pattern, **kwargs)
        else:
            await expect(self.page.locator(target_selector)).to_have_text(pattern, **kwargs)

    @register_action(AssertCheckedExec)
    async def expect_checked(
        self,
        *,
        target_selector: str,
        checked: bool = True,
        timeout: float | None = None,
    ) -> None:
        locator = self.page.locator(target_selector)
        kwargs = {"timeout": timeout} if timeout else {}

        if checked:
            await expect(locator).to_be_checked(**kwargs)
        else:
            await expect(locator).not_to_be_checked(**kwargs)

    @register_action(AssertElementCountExec)
    async def expect_count(
        self,
        *,
        target_selector: str,
        expected_count: int,
        comparison: Literal["eq", "gt", "gte", "lt", "lte"] = "eq",
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}

        if comparison == "eq":
            locator = self.page.locator(target_selector)
            await expect(locator).to_have_count(expected_count, **kwargs)
        else:
            op_map = {"gt": ">", "gte": ">=", "lt": "<", "lte": "<="}
            op = op_map[comparison]
            js = (
                f"() => document.querySelectorAll({target_selector!r}).length "
                f"{op} {expected_count}"
            )
            await self.page.wait_for_function(js, **kwargs)
    
    @register_action(AssertTextExec)
    async def expect_text(
        self,
        *,
        target_selector: str,
        text: str,
        match_mode: Literal["exact", "contains", "starts_with", "ends_with"] = "contains",
        case_sensitive: bool = True,
        negated: bool = False,
        timeout: float | None = None,
    ) -> None:
        kwargs = {"timeout": timeout} if timeout else {}
        flags = 0 if case_sensitive else re.IGNORECASE

        match match_mode:
            case "exact":
                pattern = re.compile(f"^{re.escape(text)}$", flags)
            case "contains":
                pattern = re.compile(re.escape(text), flags)
            case "starts_with":
                pattern = re.compile(f"^{re.escape(text)}", flags)
            case "ends_with":
                pattern = re.compile(f"{re.escape(text)}$", flags)

        locator = self.page.locator(target_selector)
        expectation = expect(locator)

        if negated:
            await expectation.not_to_have_text(pattern, **kwargs)
        else:
            await expectation.to_have_text(pattern, **kwargs)

    @register_action(AssertJSEvalExec)
    async def assert_js_eval(
        self,
        *,
        code: str,
        arg: Any = None,
    ) -> Any:
        await self.page.wait_for_function(code, arg=arg)


PlaywrightBrowser.build_dispatch()
