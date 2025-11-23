from abc import ABC, abstractmethod
from models import (
    Action, 
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
from typing import Literal, List, Dict, Callable

class BaseBrowser(ABC):
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
        self.action_map: Dict[ACTION, Callable] = self._initialize_action_map()
    
    def _initialize_action_map(self) -> Dict[ACTION, Callable]:
        return {
            ACTION.CLICK: self._action_click,
            ACTION.INPUT: self._action_input,
            ACTION.SCROLL: self._action_scroll,

            ACTION.GO_BACKWARD: self._action_go_backward,
            ACTION.DRAG: self._action_drag,
            ACTION.HOVER: self._action_hover,
            ACTION.FOCUS: self._action_focus,

            ACTION.OPTION: self._action_select_option,
        }
    
    def execute_action(self, action: Action) -> bool:
        action_method = self.action_map.get(action.action_type)
        assert action_method is not None
        
        try:
            code = action_method(action)
            action.success = True
            self.executed_code_history.append(code)
            return True
        except Exception as e:
            action.success = False
            action.error = str(e)
            return False
        
    @abstractmethod
    def start(self, url: str):
        pass

    def close(self):
        self.clear_code_history()
    
    @abstractmethod
    def _action_click(self, action: ClickAction) -> str:
        pass
    
    @abstractmethod
    def _action_input(self, action: InputAction) -> str:
        pass

    @abstractmethod
    def _action_drag(self, action: DragAction) -> str:
        pass

    @abstractmethod
    def _action_hover(self, action: HoverAction) -> str:
        pass

    @abstractmethod
    def _action_focus(self, action: FocusAction) -> str:
        pass

    @abstractmethod
    def _action_scroll(self, action: ScrollAction) -> str:
        pass
    
    @abstractmethod
    def _action_go_backward(self, action: GoBackwardAction) -> str:
        pass

    @abstractmethod
    def _action_select_option(self, action: SelectOptionAction) -> str:
        pass
    
    def get_executed_code_history(self) -> List[str]:
        return self.executed_code_history.copy()
    
    def clear_code_history(self) -> None:
        self.executed_code_history.clear()

    @abstractmethod
    def close(self):
        pass

    @abstractmethod
    def _serialize(self) -> DOMElement:
        pass

    @abstractmethod
    def _get_selector_by_interactive_id(self) -> str:
        pass

    @abstractmethod
    def get_browser_state(self) -> BrowserState:
        pass