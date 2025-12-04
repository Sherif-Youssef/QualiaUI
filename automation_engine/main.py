from testing_agent import TestingAgent
from browser import PlaywrightBrowser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
import os
import logging
from dotenv import load_dotenv
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

browser = PlaywrightBrowser()

testingAgent = TestingAgent(
    llm=llm,
    browser=browser
)

prompt = """
Login in as the standard user and add a bike light to your cart, then logout and login again. Make sure the item you added is still in the cart. Then checkout, use any random but believable info when checking out.
"""

url = "https://www.saucedemo.com/"

testingAgent.start(prompt, url)