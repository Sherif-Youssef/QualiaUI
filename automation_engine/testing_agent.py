from langchain_core.language_models.chat_models import BaseChatModel
from browser import BaseBrowser
from agent import PlanningAgent
from models import BrowserState, AgentHistory, BrowserAction
from typing import List, Tuple
import time


MAX_ACTIONS = 50

class TestingAgent:
    def __init__(
        self,
        llm: BaseChatModel,
        browser: BaseBrowser,
    ):  
        self.llm = llm
        self.browser = browser
    
    def start(
        self, 
        prompt: str, 
        url: str
    ) -> Tuple[List[str], bool]:
        assert self.llm and self.browser

        planning_agent = PlanningAgent(self.llm)

        self.browser.start(url)

        browser_state = self.browser.get_browser_state()
        agent_history = AgentHistory(
            goal=prompt,
            max_actions=MAX_ACTIONS,
        )

        while not agent_history.is_finished() or agent_history.has_reached_limit():
            action = planning_agent.decide_next_action(browser_state, agent_history)
            if isinstance(action, BrowserAction):
                self.browser.execute_action(action)

                time.sleep(2)
                
                browser_state = self.browser.get_browser_state()
            agent_history.add_action(action)


        code = self.browser.get_executed_code_history()
        self.browser.close()
        

        return code, agent_history.is_completed()