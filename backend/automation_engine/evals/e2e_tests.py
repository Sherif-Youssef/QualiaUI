import pytest
import os
from dotenv import load_dotenv

from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams

from automation_engine.engine import TestingEngine
from automation_engine.config import EngineConfig, BrowserConfig
from automation_engine.serialization import HistoryRenderer

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def get_agent_success_metric(instruction: str):
    return GEval(
        name="End-to-End Task Completion",
        criteria=f"Determine if the web agent successfully completed the multi-step E2E instruction: '{instruction}'. You are provided with the agent's ACTION HISTORY and the FINAL PAGE STATE. Review the action history to ensure the agent actually performed the required steps (e.g. logging in, adding the correct item, submitting the checkout). Then, review the final page state for success indicators (e.g. order confirmation, success banners). If the agent skipped required steps or the final state does not reflect success, fail.",
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model="gpt-5.4-mini-2026-03-17"
    )

E2E_SCENARIOS = [
    (
        "Login using username 'standard_user' and password 'secret_sauce'. Add the 'Sauce Labs Bike Light' to the cart, go to the cart, and complete the entire checkout process using random checkout information.",
        "https://www.saucedemo.com/",
        "saucedemo_checkout"
    ),
    (
        "Click 'Register' and create a new account using random valid details (username, password, name, address, etc). Once registered, click 'Open New Account', choose 'Checking' as the account type, and open it. Assert you see the confirmation message.",
        "https://parabank.parasoft.com/parabank/",
        "parabank_account_creation"
    ),
    (
        "Login using username 'Admin' and password 'admin123'. Navigate to the 'PIM' module via the sidebar, click 'Add', fill in a First Name: Omar and Last Name: Saleh, and save the new employee profile.",
        "https://opensource-demo.orangehrmlive.com/web/index.php/auth/login",
        "orangehrm_add_employee"
    ),
    (
        "Reserve Flight#43 from San Diego to London, use any random believable information.",
        "https://blazedemo.com/",
        "blazedemo_reserve_flight"
    )
]

@pytest.mark.asyncio
@pytest.mark.parametrize("instruction, url, test_id", E2E_SCENARIOS, ids=[s[2] for s in E2E_SCENARIOS])
async def test_e2e(instruction: str, url: str, test_id: str):
    engine = TestingEngine(config=EngineConfig(browser=BrowserConfig(headless=True)))
    
    async with engine.launch(url) as session:
        async for step in session.run_loop(instruction):
            pass
            
        session.finalize()
        history_text = HistoryRenderer().render_history(session.summary)
        final_dom = await session._browser.page.locator("body").aria_snapshot(mode='ai')
        
    actual_output = f"ACTION HISTORY:\n{history_text}\n\nFINAL PAGE STATE:\n{final_dom}"
    test_case = LLMTestCase(input=instruction, actual_output=actual_output)
    assert_test(test_case, [get_agent_success_metric(instruction)])
