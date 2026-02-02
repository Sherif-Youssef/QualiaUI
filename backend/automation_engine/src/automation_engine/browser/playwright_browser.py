from playwright.async_api import async_playwright, Page, Browser, BrowserContext, Playwright, Locator, Error
from .base_browser import BaseBrowser
from automation_engine.models import (
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
from automation_engine.dom.utils import get_js_serializer_file_path, IMPORTANT_EVENTS

class PlaywrightBrowser(BaseBrowser):

    def __init__(self, browser_engine: Literal['chromium', 'firefox', 'webkit'] = 'chromium', headless: bool = False):
        super().__init__(browser_engine, headless)
        
        self.context: BrowserContext | None = None
        self.page: Page | None = None
        self.playwright: Playwright | None = None
        self.browser: Browser | None = None
        
    async def pause_time(self) -> None:
        return
        await self.cdp_session.send('Emulation.setVirtualTimePolicy', {
            'policy': 'pause'
        })
    
    async def resume_time(self) -> None:
        return
        await self.cdp_session.send('Emulation.setVirtualTimePolicy', {
            'policy': 'advance',
        })

    async def start(self, url: str):
        if self.playwright is not None:
            raise RuntimeError("Browser already started.")
        
        self.playwright = await async_playwright().start()
        
        if self.browser_engine == 'chromium':
            self.browser = await self.playwright.chromium.launch(headless=self.headless)
        elif self.browser_engine == 'firefox':
            self.browser = await self.playwright.firefox.launch(headless=self.headless)
        elif self.browser_engine == 'webkit':
            self.browser = await self.playwright.webkit.launch(headless=self.headless)
        
        self.context = await self.browser.new_context()
        await self.context.add_init_script(path=get_js_serializer_file_path())

        self.page = await self.context.new_page()
        self.cdp_session = await self.page.context.new_cdp_session(self.page)
        await self.cdp_session.send("DOM.enable")

        await self.page.goto(url)
        await self.pause_time()
    
    async def close(self):
        if self.page:
            await self.page.close()
            self.page = None
        if self.context:
            await self.context.close()
            self.context = None
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        
    async def _action_input(self, action: InputInteractionAction) -> None:
        for input_field in action.input:
            target_selector = self._get_selector_by_element_id(input_field.target_id)
            await self.page.fill(target_selector, input_field.input)

    async def _action_click(self, action: ClickInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        method_name = "dblclick" if action.double_click else "click"
        await getattr(self.page, method_name)(target_selector, button=action.button, modifiers=action.keyboard_modifiers)
    
    async def _action_select_option(self, action: SelectOptionInteractionAction) -> None:        
        select_element = self._get_selector_by_element_id(action.select_element_id)
        option_value = self._get_element_by_id(action.option_element_id).attributes["value"]
        await self.page.select_option(select_element, option_value)

    async def _action_drag(self, action: DragInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        source_selector = self._get_selector_by_element_id(action.source_id)
        await self.page.locator(source_selector).drag_to(self.page.locator(target_selector))
    
    async def _action_hover(self, action: HoverInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        await self.page.locator(target_selector).hover()

    async def _action_focus(self, action: FocusInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        await self.page.locator(target_selector).focus()

    async def _action_press(self, action: PressInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        key_str = "+".join(action.key_strokes)
        await self.page.locator(target_selector).press(key_str)

    async def _action_scroll(self, action: ScrollInteractionAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        await self.page.locator(target_selector).scroll_into_view_if_needed()

    async def _action_execute_js_code(self, action: ExecuteJSCodeInteractionAction):
        ready_code = self._replace_placeholders(action.code)
        try:
            await self.page.evaluate(ready_code)
        except Error as e:
            if "Execution context was destroyed" not in str(e):
                raise
    

    async def _action_js_code_assert(self, action: ExecuteJSCodeAssertionAction) -> None:
        ready_code = self._replace_placeholders(action.code)
        result = await self.page.evaluate(ready_code)
        action.success, action.error = result.get('success'), result.get('error')

    async def _action_ai_eval_assert(self, action: AIEvalAssersionAction):
        action.success = action.eval_result


    async def _action_timeout_wait(self, action: TimeoutWaitingAction) -> None:
        await self.page.wait_for_timeout(action.timeout_miliseconds)

    async def _action_state_wait(self, action: StateWaitingAction) -> None:
        target_selector = self._get_selector_by_element_id(action.target_id)
        await self.page.wait_for_selector(target_selector, timeout=action.timeout_miliseconds, state=action.target_state)

    async def _action_js_code_wait(self, action: ExecuteJSCodeWaitingAction) -> None:
        ready_code = self._replace_placeholders(action.code)
        try:
            await self.page.wait_for_function(f"const testFunc = {ready_code}; testFunc()['success']", timeout=action.timeout_miliseconds)
        except TimeoutError:
            pass
        result = await self.page.evaluate(ready_code)
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

    async def _serialize(self) -> DOMElement:
        await self.page.wait_for_load_state("domcontentloaded")

        # for locator in self.page.locator("*").all():
            # if self._has_important_event_listeners(locator):
                # locator.evaluate("(el) => el.setAttribute('hasInteractiveListener', true)")

        result: dict = await self.page.evaluate(f"window.getSimplifiedDOMInJSON()")
        new_dom_head = DOMElement(**result)
        self.dom_state = DOMState(new_dom_head)
        return new_dom_head

    @BaseBrowser.unfreeze_time
    async def get_browser_state(self) -> BrowserState:
        assert self.page

        return BrowserState(
            current_url=self.page.url,
            page_title=await self.page.title(),
            parent=await self._serialize()
        )