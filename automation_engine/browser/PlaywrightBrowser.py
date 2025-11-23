from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, Playwright
from .BaseBrowser import BaseBrowser
from models import (
    ACTION,
    ClickAction,
    InputAction,
    ScrollAction,
    GoBackwardAction,
    HoverAction,
    DragAction,
    FocusAction,
    DOMElement,
    SelectOptionAction,
    BrowserState
)
from typing import Literal, List

from abc import ABC, abstractmethod
from typing import Dict
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, Playwright, Locator
from .BaseBrowser import BaseBrowser
from models import (
    ACTION,
    ClickAction,
    InputAction,
    ScrollAction,
    GoBackwardAction,
    HoverAction,
    DragAction,
    FocusAction,
    DOMElement
)
from typing import Literal, List
from dom.utils import get_js_serializer_file_path, IMPORTANT_EVENTS

class PlaywrightBrowser(BaseBrowser):
    def __init__(self, browser_engine: Literal['chromium', 'firefox', 'webkit'] = 'chromium', headless: bool = False):
        super().__init__(browser_engine, headless)
        
        self.context: BrowserContext | None = None
        self.page: Page | None = None
        self.playwright: Playwright | None = None
        self.browser: Browser | None = None
        self.dom_elements: Dict[int, DOMElement] | None = None
        
    def start(self, url: str):
        if self.playwright is not None:
            raise RuntimeError("Browser already started.")
        
        self.playwright = sync_playwright().start()
        
        if self.browser_engine == 'chromium':
            self.browser = self.playwright.chromium.launch(headless=self.headless)
        elif self.browser_engine == 'firefox':
            self.browser = self.playwright.firefox.launch(headless=self.headless)
        elif self.browser_engine == 'webkit':
            self.browser = self.playwright.webkit.launch(headless=self.headless)
        
        self.context = self.browser.new_context()

        self.page = self.context.new_page()
        js_file_path = get_js_serializer_file_path()
        self.page.add_script_tag(path=js_file_path)
        self.cdp_session = self.page.context.new_cdp_session(self.page)
        self.cdp_session.send("DOM.enable")

        self.page.goto(url)
    
    def close(self):
        super().close()
        if self.page:
            self.page.close()
            self.page = None
        if self.context:
            self.context.close()
            self.context = None
        if self.browser:
            self.browser.close()
            self.browser = None
        if self.playwright:
            self.playwright.stop()
            self.playwright = None

    def _action_click(self, action: ClickAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        self.page.click(target_selector)
        code = f"page.click('{target_selector}')"
        return code
    
    def _action_input(self, action: InputAction) -> str:
        code = ""
        for input in action.input:
            target_selector = self._get_selector_by_interactive_id(input.target_id)
            self.page.fill(target_selector, input.input)
            code += f"page.fill({target_selector}, {input.input})\n"
        return code
    
    def _action_select_option(self, action: SelectOptionAction) -> str:
        self.page.click(action.select_element_id)
        
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        option_value = self.dom_elements[action.option_element_id].attributes['value']
        self.page.select_option(target_selector, option_value)
        return f"page.select_option({target_selector}, value={option_value})"

    def _action_drag(self, action: DragAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        source_selector = self._get_selector_by_interactive_id(action.source_id)
        self.page.locator(source_selector).dragTo(self.page.locator(target_selector))
        return f"page.locator({source_selector}).dragTo(page.locator({target_selector}))"
    
    def _action_hover(self, action: HoverAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        self.page.locator(target_selector).hover()
        return f"page.locator({target_selector}).hover()"

    def _action_focus(self, action: FocusAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        self.page.locator(target_selector).focus()
        return f"page.locator({target_selector}).focus()"

    def _action_scroll(self, action: ScrollAction) -> str:
        js = f"window.scrollTo({action.x}, {action.y})"
        self.page.evaluate(js)
        return f"page.evaluate({js})"
    
    def _action_go_backward(self, action: GoBackwardAction) -> str:
        self.page.go_back()
        return f"page.go_back()"
    


    def _get_event_listeners(self, locator: Locator) -> list[str]:
        element_handle = locator.element_handle()
        self.page.evaluate("(el) => { window.__tmpElement = el; }", element_handle)

        result = self.client.send("Runtime.evaluate", {
            "expression": "window.__tmpElement",
            "returnByValue": False
        })
        object_id = result["result"]["objectId"]
        self.page.evaluate("() => { delete window.__tmpElement; }")

        event_listeners = self.client.send("DOMDebugger.getEventListeners", {"objectId": object_id})
        return [event["type"] for event in event_listeners["listeners"] if event["type"] != "invalid"]

    def _has_important_event_listeners(self, locator) -> bool:
        events = set(self._get_event_listeners(locator))
        return not events.isdisjoint(self.IMPORTANT_EVENTS)

    def _flatten_dom_elements(self, head: DOMElement):
        self.dom_elements[head.interactive_id] = head
        for child in head.children:
            self._flatten_dom_elements(child)

    def _serialize(self) -> DOMElement:
        # for locator in self.page.locator("*").all():
            # if self._has_important_event_listeners(locator):
                # locator.evaluate("(el) => el.setAttribute('hasInteractiveListener', true)")
        js_file_path = get_js_serializer_file_path()
        with open(js_file_path, "r") as f:
            js_code = f.read()
        
        self.page.add_script_tag(path=js_file_path)

        json_result = self.page.evaluate(f"getSimplifiedDOMInJSON()")
        new_dom_head = DOMElement.model_validate_json(json_result)
        self.dom_elements = {}
        self._flatten_dom_elements(new_dom_head)
        return new_dom_head

    def _get_selector_by_interactive_id(self, interactive_id: int) -> str:
        return self.dom_elements[interactive_id].selector

    def get_browser_state(self) -> BrowserState:
        assert self.page

        a = self._serialize()
        with open(file='result.txt', mode='w', encoding='utf-8') as f:
            f.write(self.page.content())

        return BrowserState(
            current_url=self.page.title(),
            page_title=self.page.url,
            parent=a
        )