import functools
from abc import ABC, abstractmethod
from models import (
    ACTION,
    Action,
    INTERACTION,
    InteractionAction,
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
from typing import Literal, List, Dict, Callable, Any, Type

class BaseBrowser(ABC):
    action_registry: Dict[Type[Action], Callable[[Action], str]] = {}

    def __init__(
            self, 
            browser_engine: Literal['chromium', 'firefox', 'webkit'] = 'chromium', 
            headless: bool = False
        ):
        if browser_engine not in ['chromium', 'firefox', 'webkit']:
            raise ValueError(f"Unsupported browser engine: {browser_engine}")

        self.browser_engine = browser_engine
        self.headless = headless
        self.dom_state: DOMState | None = None

    @staticmethod
    def register_action_function(action_registry) -> None:
        def decorator(func):
            action_type = func.__annotations__.get("action")
            action_registry[action_type] = func.__name__
            return func
        
        return decorator
    
    @abstractmethod
    def pause_time(self) -> None:
        pass

    @abstractmethod
    def resume_time(self) -> None:
        pass

    @staticmethod
    def unfreeze_time(func):
        @functools.wraps(func)
        def wrapper(self: "BaseBrowser", *args, **kwargs):
            try:
                self.resume_time()
                return func(self, *args, **kwargs)
            finally:
                self.pause_time()
        return wrapper

    @unfreeze_time
    def execute_action(self, action: Action) -> bool:
        action_func_name = self.action_registry.get(type(action))
        assert action_func_name is not None

        action_method = getattr(self, action_func_name)
        try:
            action_method(action)
            action.success = True
            return True
        except Exception as e:
            action.success = False
            action.error = str(e)
            return False
    
    def _get_selector_by_element_id(self, element_id: int) -> str:
        return self.dom_state.get_selector_by_element_id(element_id)
    
    def _get_element_by_id(self, element_id: int) -> str:
        return self.dom_state.get_element_by_id(element_id)

    @abstractmethod
    def start(self, url: str):
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_input(self, action: InputInteractionAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_click(self, action: ClickInteractionAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_hover(self, action: HoverInteractionAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_select_option(self, action: SelectOptionInteractionAction) -> None:
        pass
    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_press(self, action: PressInteractionAction) -> None:
        pass
    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_focus(self, action: FocusInteractionAction) -> None:
        pass
    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_drag(self, action: DragInteractionAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_scroll(self, action: ScrollInteractionAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_execute_js_code(self, action: ExecuteJSCodeInteractionAction) -> None:
        pass

    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_ai_eval_assert(self, action: AIEvalAssersionAction):
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_js_code_assert(self, action: ExecuteJSCodeAssertionAction) -> None:
        pass


    @abstractmethod
    @register_action_function(action_registry)
    def _action_timeout_wait(self, action: TimeoutWaitingAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_state_wait(self, action: StateWaitingAction) -> None:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_js_code_wait(self, action: ExecuteJSCodeWaitingAction) -> None:
        pass
    

    @abstractmethod
    def close(self):
        pass
    
    @unfreeze_time
    @abstractmethod
    def get_browser_state(self) -> BrowserState:
        pass

    def _replace_placeholders(self, js_code: str) -> str:
        import re
        pattern = r"\{\{ID_(\d+)\}\}"

        def replacer(match):
            interactive_id = int(match.group(1))
            try:
                selector = self._get_selector_by_interactive_id(interactive_id)
            except Exception:
                raise KeyError(
                    f"No selector found for interactive ID {interactive_id}"
                )
            return f"'{selector}'"

        code = re.sub(pattern, replacer, js_code)
        with open("code.txt", "a") as f:
            f.write(code)
        return code
