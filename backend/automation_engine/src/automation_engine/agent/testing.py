from typing import AsyncGenerator, Type
from langchain_core.language_models.chat_models import BaseChatModel
from automation_engine.browser import BaseBrowser
from automation_engine.agent import PlanningAgent
from automation_engine.models import AgentHistory, Action, BrowserAction, InteractionAction, AssertionAction, WaitingAction


class TestingAgent:
    def __init__(
        self, 
        llm: BaseChatModel,
        browser: BaseBrowser,
        max_actions_per_step: int = 50
    ):
        self._max_actions_per_step = max_actions_per_step
        self._browser = browser
        self._llm = llm
        self._agent_history: AgentHistory | None = None

    async def start(self, url: str) -> None:
        await self._browser.start(url)
        self._agent_history = AgentHistory()

    async def run_generic(self, prompt: str, max_actions: int = None) -> AsyncGenerator[Action, None]:
        generator = self.run_with_action_type(prompt, max_actions, Action)
        async for action in generator:
            yield action

    async def run_interaction(self, prompt: str, max_actions: int = None) -> AsyncGenerator[Action, None]:
        generator = self.run_with_action_type(prompt, max_actions, InteractionAction)
        async for action in generator:
            yield action

    async def run_asssertion(self, prompt: str, max_actions: int = None) -> AsyncGenerator[Action, None]:
        generator = self.run_with_action_type(prompt, max_actions, AssertionAction)
        async for action in generator:
            yield action

    async def run_waiting(self, prompt: str, max_actions: int = None) -> AsyncGenerator[Action, None]:
        generator = self.run_with_action_type(prompt, max_actions, WaitingAction)
        async for action in generator:
            yield action
    
    async def run_with_action_type(self, prompt: str, max_actions: int = None, action_type: Type[Action] = Action) -> AsyncGenerator[Action, None]:
        assert self._agent_history
        planning_agent = PlanningAgent(self._llm, [action_type])
        self._agent_history.update_goal(prompt)
        max_actions = max_actions or self._max_actions_per_step
        for _ in range(max_actions):
            if self._agent_history.is_finished():
                break
            browser_state = await self._browser.get_browser_state()
            action = await planning_agent.decide_next_action(browser_state, self._agent_history)
            if isinstance(action, BrowserAction):
                await self._browser.execute_action(action)
                browser_state = await self._browser.get_browser_state()
            self._agent_history.add_action(action)
            yield action

    async def close(self) -> None:
        await self._browser.close()
