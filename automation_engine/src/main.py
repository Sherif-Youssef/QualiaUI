import os
import logging
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from agent import TestingAgent
from browser import PlaywrightBrowser

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG,
    format='{asctime} - {name} - Line {lineno} - {levelname} - {message}',
    style='{'
)

# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     google_api_key=os.getenv("GEMINI_KEY"),
# )

# llm = ChatOpenAI(
#     model="x-ai/grok-4.1-fast:free",
#     api_key=os.getenv("OPENROUTER_KEY"),
#     base_url="https://openrouter.ai/api/v1",
# )

llm = ChatOpenAI(
    model="tngtech/deepseek-r1t2-chimera:free",
    api_key=os.getenv("OPENROUTER_KEY"),
    base_url="https://openrouter.ai/api/v1",
)


prompt = """
Login in as the standard user and add a bike light to your cart, then logout and login again. Make sure the item you added is still in the cart. Then checkout, use any random but believable info when checking out.
"""

url = "https://www.saucedemo.com/"


async def main():
    browser = PlaywrightBrowser()
    testing_agent = TestingAgent(llm=llm, browser=browser)
    await testing_agent.start(url)
    
    async for action in testing_agent.run_generic(prompt):
        print(action.recreation_prompt)
    await testing_agent.close()

if __name__ == "__main__":
    asyncio.run(main())