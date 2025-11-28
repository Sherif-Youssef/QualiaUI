from models import BrowserState, AgentHistory, Action
from langchain_core.language_models.chat_models import BaseChatModel
from exceptions import RequestFinishedException
from prompts import prompt_template
import json
import logging
from pydantic import ValidationError

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PlanningAgent:
    def __init__(self, llm: BaseChatModel):        
        self.llm = llm
    
    def _format_context(self, browser_state: BrowserState, agent_history: AgentHistory):
        return f"""
            Browser State:
            {browser_state.to_llm_string()}
            Agent History:
            {str(agent_history.model_dump())}
        """

    def decide_next_action(
        self, 
        browser_state: BrowserState, 
        agent_history: AgentHistory
    ) -> Action:
        if agent_history.is_finished():
            raise RequestFinishedException()
        
        if agent_history.has_reached_limit():
            return Action(
                action_type="failed",
                error="Maximum action limit reached",
            )
        
        context = self._format_context(browser_state, agent_history)
        # logger.debug(f"Context: {context}")
        prompt = prompt_template.format(
            context = context
        )
        
        try:
            response = self.llm.invoke(prompt)
        except Exception as e:
            pass
        

        response = response.content
        logger.info(f"LLM Response: {response}")
        action: Action = Action.parse_action(json.loads(response))

        return action
        
        