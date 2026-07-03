import asyncio
import time
import sys
import logging
from typing import Dict, Any

from automation_engine.engine import TestingEngine
from evals.tasks import EVAL_TASKS
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
os.environ["BROWSER_HEADLESS"] = "true"

logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

logging.getLogger("httpx").setLevel(logging.WARNING)

from automation_engine.config import EngineConfig, BrowserConfig

async def run_evaluation():
    try:
        engine = TestingEngine(
            config=EngineConfig(browser=BrowserConfig(headless=True))
        )
    except Exception as e:
        logger.error(f"Failed to initialize TestingEngine: {e}")
        logger.error("Make sure LLM configuration and API keys are set correctly.")
        sys.exit(1)
    
    results: list[Dict[str, Any]] = []

    print("========================================")
    print(f"Starting Evaluation on {len(EVAL_TASKS)} tasks")
    print("========================================")

    for idx, task in enumerate(EVAL_TASKS, 1):
        print(f"\n[Task {idx}/{len(EVAL_TASKS)}] {task.id}")
        print(f"Instruction: {task.instruction}")
        
        start_time = time.time()
        
        success = False
        steps_taken = 0
        error_msg = None
        
        try:
            async with engine.launch(task.url) as session:
                async for step_or_term in session.run_loop(task.instruction):
                    steps_taken += 1
                
                success = await task.oracle(session._browser.page)
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Task {task.id} failed with error: {e}")

        duration = time.time() - start_time
        
        print(f"Result: {'PASS' if success else 'FAIL'}")
        print(f"Time: {duration:.2f}s | Steps: {steps_taken}")
        if error_msg:
            print(f"Error: {error_msg}")
            
        results.append({
            "task_id": task.id,
            "success": success,
            "steps_taken": steps_taken,
            "duration_s": duration,
            "error": error_msg
        })

    print("\n========================================")
    print("Evaluation Summary")
    print("========================================")
    
    passed = sum(1 for r in results if r["success"])
    total = len(results)
    
    for r in results:
        status = "[PASS]" if r["success"] else "[FAIL]"
        print(f"{status} {r['task_id']} ({r['steps_taken']} steps, {r['duration_s']:.1f}s)")
        
    print(f"\nTotal Pass Rate: {passed}/{total} ({(passed/total)*100:.1f}%)")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
