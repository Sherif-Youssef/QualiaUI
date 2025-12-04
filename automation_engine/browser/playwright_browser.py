from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext, Playwright, Locator, Error
from .base_browser import BaseBrowser
from models import (
    DOMElement,
    DOMState,
    BrowserState,
    InputInteractionAction,
    ClickInteractionAction,
    HoverInteractionAction,
    SelectOptionInteractionAction,
    PressInteractionAction,
    FocusInteractionAction,
    DragInteractionAction,
    ScrollInteractionAction,
    ExecuteJSCodeInteractionAction,
    
    AIEvalAssersionAction,
    ExecuteJSCodeAssertionAction,

    TimeoutWaitingAction,
    StateWaitingAction,
    ExecuteJSCodeWaitingAction
)
from typing import Literal
from dom.utils import get_js_serializer_file_path, IMPORTANT_EVENTS

class PlaywrightBrowser(BaseBrowser):

    def __init__(self, browser_engine: Literal['chromium', 'firefox', 'webkit'] = 'chromium', headless: bool = False):
        super().__init__(browser_engine, headless)
        
        self.context: BrowserContext | None = None
        self.page: Page | None = None
        self.playwright: Playwright | None = None
        self.browser: Browser | None = None
        
    def pause_time(self) -> None:
        return
        self.cdp_session.send('Emulation.setVirtualTimePolicy', {
            'policy': 'pause'
        })
    
    def resume_time(self) -> None:
        return
        self.cdp_session.send('Emulation.setVirtualTimePolicy', {
            'policy': 'advance',
        })

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
        self.pause_time()
    
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
        
    def _action_input(self, action: InputInteractionAction) -> None:
        for input_field in action.input:
            target_selector = self._get_selector_by_element_id(input_field.target_id)
            self.page.fill(target_selector, input_field.input)

    def _action_click(self, action: ClickInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        method_name = "dblclick" if action.double_click else "click"
        getattr(self.page, method_name)(target_selector, button=action.button, modifiers=action.keyboard_modifiers)
    
    def _action_select_option(self, action: SelectOptionInteractionAction) -> None:        
        select_element = self._get_selector_by_element_id(action.select_element_id)
        option_value = self._get_element_by_id(action.option_element_id).attributes["value"]
        self.page.select_option(select_element, option_value)

    def _action_drag(self, action: DragInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        source_selector = self._get_selector_by_element_id(action.source_id)
        self.page.locator(source_selector).dragTo(self.page.locator(target_selector))
    
    def _action_hover(self, action: HoverInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        self.page.locator(target_selector).hover()

    def _action_focus(self, action: FocusInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        self.page.locator(target_selector).focus()

    def _action_press(self, action: PressInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        key_str = "+".join(action.key_strokes)
        self.page.locator(target_selector).press(key_str)

    def _action_scroll(self, action: ScrollInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        self.page.locator(target_selector).scroll_into_view_if_needed()

    def _action_execute_js_code(self, action: ExecuteJSCodeInteractionAction):
        ready_code = self._replace_placeholders(action.code)
        try:
            self.page.evaluate(ready_code)
        except Error as e:
            if "Execution context was destroyed" not in str(e):
                raise
    

    def _action_js_code_assert(self, action: ExecuteJSCodeAssertionAction) -> None:
        ready_code = self._replace_placeholders(action.code)
        result = self.page.evaluate(ready_code)
        action.success, action.error = result.get('success'), result.get('error')

    def _action_ai_eval_assert(self, action: AIEvalAssersionAction):
        action.success = action.eval_result


    def _action_timeout_wait(self, action: TimeoutWaitingAction) -> None:
        self.page.wait_for_timeout(action.timeout_miliseconds)

    def _action_state_wait(self, action: StateWaitingAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        self.page.wait_for_selector(target_selector, timeout=action.timeout_miliseconds, state=action.target_state)

    def _action_js_code_wait(self, action: ExecuteJSCodeWaitingAction) -> None:
        ready_code = self._replace_placeholders(action.code)
        try:
            self.page.wait_for_function(f"const testFunc = {ready_code}; testFunc()['success']", timeout=action.timeout_miliseconds)
        except TimeoutError:
            pass
        result = self.page.evaluate(ready_code)
        action.success, action.error = result.get('success'), result.get('error')
        

    # def _get_event_listeners(self, locator: Locator) -> list[str]:
    #     element_handle = locator.element_handle()
    #     self.page.evaluate("(el) => { window.__tmpElement = el; }", element_handle)

    #     result = self.cdp_session.send("Runtime.evaluate", {
    #         "expression": "window.__tmpElement",
    #         "returnByValue": False
    #     })
    #     object_id = result["result"]["objectId"]
    #     self.page.evaluate("() => { delete window.__tmpElement; }")

    #     event_listeners = self.cdp_session.send("DOMDebugger.getEventListeners", {"objectId": object_id})
    #     return [event["type"] for event in event_listeners["listeners"] if event["type"] != "invalid"]

    # def _has_important_event_listeners(self, locator) -> bool:
    #     events = set(self._get_event_listeners(locator))
    #     return not events.isdisjoint(IMPORTANT_EVENTS)

    def _serialize(self) -> DOMElement:
        self.page.wait_for_load_state("domcontentloaded")

        # for locator in self.page.locator("*").all():
            # if self._has_important_event_listeners(locator):
                # locator.evaluate("(el) => el.setAttribute('hasInteractiveListener', true)")

        result: dict = self.page.evaluate(f"window.getSimplifiedDOMInJSON()")
        new_dom_head = DOMElement(**result)
        self.dom_state = DOMState(new_dom_head)
        return new_dom_head

    @BaseBrowser.unfreeze_time
    def get_browser_state(self) -> BrowserState:
        assert self.page

        return BrowserState(
            current_url=self.page.url,
            page_title=self.page.title(),
            parent=self._serialize()
        )