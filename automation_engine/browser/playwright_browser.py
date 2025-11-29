from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, Playwright, Locator
from .base_browser import BaseBrowser
from models import (
    INTERACTION,
    Action,
    DOMElement,
    DOMState,
    BrowserState,
    ClickInteractionAction,
    InputInteractionAction,
    SelectOptionInteractionAction,
    DragInteractionAction,
    HoverInteractionAction,
    FocusInteractionAction,
    GoBackwardInteractionAction,
    ExecuteJSCodeAssertionAction
)
from typing import Literal, Dict
from dom.utils import get_js_serializer_file_path, IMPORTANT_EVENTS

class PlaywrightBrowser(BaseBrowser):

    def __init__(self, browser_engine: Literal['chromium', 'firefox', 'webkit'] = 'chromium', headless: bool = False):
        super().__init__(browser_engine, headless)
        
        self.context: BrowserContext | None = None
        self.page: Page | None = None
        self.playwright: Playwright | None = None
        self.browser: Browser | None = None
        
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
        self.context.add_init_script(path=get_js_serializer_file_path())

        self.page = self.context.new_page()
        self.cdp_session = self.page.context.new_cdp_session(self.page)
        self.cdp_session.send("DOM.enable")

        self.page.goto(url)
    
    def close(self):
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
        
        self.clear_code_history()

    def _action_click(self, action: ClickInteractionAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        self.page.click(target_selector)
        code = f"page.click('{target_selector}')"
        return code
    
    def _action_input(self, action: InputInteractionAction) -> str:
        code = ""
        for input_field in action.input:
            target_selector = self._get_selector_by_interactive_id(input_field.target_id)
            self.page.fill(target_selector, input_field.input)
            code += f"page.fill({target_selector}, {input_field.input})\n"
        return code
    
    def _action_select_option(self, action: SelectOptionInteractionAction) -> str:        
        select_element = self._get_selector_by_interactive_id(action.select_element_id)
        option_value = self._get_element_by_interactive_id(action.option_element_id).attributes["value"]
        self.page.select_option(select_element, option_value)
        return f"page.select_option({select_element}, value={option_value})"

    def _action_drag(self, action: DragInteractionAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        source_selector = self._get_selector_by_interactive_id(action.source_id)
        self.page.locator(source_selector).dragTo(self.page.locator(target_selector))
        return f"page.locator({source_selector}).dragTo(page.locator({target_selector}))"
    
    def _action_hover(self, action: HoverInteractionAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        self.page.locator(target_selector).hover()
        return f"page.locator({target_selector}).hover()"

    def _action_focus(self, action: FocusInteractionAction) -> str:
        target_selector = self._get_selector_by_interactive_id(action.target_id)
        self.page.locator(target_selector).focus()
        return f"page.locator({target_selector}).focus()"

    def _action_go_backward(self, action: GoBackwardInteractionAction) -> str:
        self.page.go_back()
        return f"page.go_back()"


    def _action_execute_js_code(self, action: ExecuteJSCodeAssertionAction) -> str:
        ready_code = self._replace_placeholders(action.code)
        result = self.page.evaluate(ready_code)
        action.success, action.error = result.get('success'), result.get('error')
        return ready_code

    def _get_event_listeners(self, locator: Locator) -> list[str]:
        element_handle = locator.element_handle()
        self.page.evaluate("(el) => { window.__tmpElement = el; }", element_handle)

        result = self.cdp_session.send("Runtime.evaluate", {
            "expression": "window.__tmpElement",
            "returnByValue": False
        })
        object_id = result["result"]["objectId"]
        self.page.evaluate("() => { delete window.__tmpElement; }")

        event_listeners = self.cdp_session.send("DOMDebugger.getEventListeners", {"objectId": object_id})
        return [event["type"] for event in event_listeners["listeners"] if event["type"] != "invalid"]

    def _has_important_event_listeners(self, locator) -> bool:
        events = set(self._get_event_listeners(locator))
        return not events.isdisjoint(self.IMPORTANT_EVENTS)

    def _serialize(self) -> DOMElement:
        # for locator in self.page.locator("*").all():
            # if self._has_important_event_listeners(locator):
                # locator.evaluate("(el) => el.setAttribute('hasInteractiveListener', true)")

        result: dict = self.page.evaluate(f"window.getSimplifiedDOMInJSON()")
        new_dom_head = DOMElement(**result)
        self.dom_state = DOMState(new_dom_head)
        return new_dom_head

    def get_browser_state(self) -> BrowserState:
        assert self.page
        
        return BrowserState(
            current_url=self.page.title(),
            page_title=self.page.url,
            parent=self._serialize()
        )