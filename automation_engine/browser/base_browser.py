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
    GoToInteractionAction,
    GoBackwardInteractionAction
)
from types import MethodType
from typing import Literal, List, Dict, Callable, Any, Type
from dataclasses import dataclass

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
        self.executed_code_history: List[str] = []
        self.dom_state: DOMState | None = None

    @staticmethod
    def register_action_function(action_registry) -> None:
        def decorator(func):
            action_type = func.__annotations__.get("action")
            action_registry[action_type] = func.__name__
            return func
        
        return decorator

    def execute_action(self, action: Action) -> bool:
        action_func_name = self.action_registry.get(type(action))
        assert action_func_name is not None

        action_method = getattr(self, action_func_name)
        try:
            code = action_method(action)
            action.success = True
            self.executed_code_history.append(code)
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
    def _action_input(self, action: InputInteractionAction) -> str:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_click(self, action: ClickInteractionAction) -> str:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_hover(self, action: HoverInteractionAction) -> str:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_select_option(self, action: SelectOptionInteractionAction) -> str:
        pass
    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_press(self, action: PressInteractionAction) -> str:
        pass
    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_focus(self, action: FocusInteractionAction) -> str:
        pass
    
    @abstractmethod
    @register_action_function(action_registry)
    def _action_drag(self, action: DragInteractionAction) -> str:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_scroll(self, action: ScrollInteractionAction) -> str:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_go_to(self, action: GoToInteractionAction) -> str:
        pass

    @abstractmethod
    @register_action_function(action_registry)
    def _action_go_backward(self, action: GoBackwardInteractionAction) -> str:
        pass

    def get_executed_code_history(self) -> List[str]:
        return self.executed_code_history.copy()
    
    def clear_code_history(self) -> None:
        self.executed_code_history.clear()

    @abstractmethod
    def close(self):
        pass

    @abstractmethod
    def get_browser_state(self) -> BrowserState:
        pass