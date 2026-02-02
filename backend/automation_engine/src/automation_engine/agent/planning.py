import json
import logging
from typing import Type
from langchain_core.language_models.chat_models import BaseChatModel
from automation_engine.models import BrowserState, AgentHistory, Action
from automation_engine.models.utils import model_to_string
from automation_engine.exceptions import RequestFinishedException, LLMFormatException, LLMConnectionException
from automation_engine.prompts import prompt_template

logger = logging.getLogger(__name__)

class PlanningAgent:
    def __init__(self, llm: BaseChatModel, action_types: list[Type[Action]]):
        self._llm = llm
        self._action_descriptions: list[str] = []
        self._extract_action_descriptions(action_types)

    def _format_prompt(self, browser_state: BrowserState, agent_history: AgentHistory) -> str:
        context = f"Browser State:\n{browser_state.to_llm_string()}\nAgent History:\n{str(agent_history.to_llm_string())}\n"
        logger.debug(f"Context:\n{context}")
        actions_str = ""
        for i, action_description in enumerate(self._action_descriptions):
            actions_str += f"{i}. {action_description}\n\n"
        return prompt_template.format(context=context, actions=actions_str)

    def _rec_extract_action_descriptions(self, action_type: Type[Action]) -> str:
        subclasses = action_type.__subclasses__()
        if len(subclasses) > 0:
            for subclass in subclasses:
                self._rec_extract_action_descriptions(subclass)
        else:
            self._action_descriptions.append(model_to_string(action_type))

    def _extract_action_descriptions(self, action_types: list[Type[Action]]) -> list[str]:
        for action_type in action_types:
            self._rec_extract_action_descriptions(action_type)
    
    async def decide_next_action(self, browser_state: BrowserState, agent_history: AgentHistory) -> Action:
        if agent_history.is_finished():
            raise RequestFinishedException()
        
        prompt = self._format_prompt(browser_state, agent_history)
        try:
            response = await self._llm.ainvoke(prompt)
        except Exception as e:
            raise LLMConnectionException from e
        
        response = response.content
        logger.info(f"LLM Response: {response}")
        try:
            action: Action = Action.parse_action(json.loads(response))
        except Exception as e:
            raise LLMFormatException from e

        return action
