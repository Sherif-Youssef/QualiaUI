from testing_agent import TestingAgent
from browser import PlaywrightBrowser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
load_dotenv()

# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     google_api_key=os.getenv("GEMINI_KEY"),
# )
llm = ChatOpenAI(
    model="x-ai/grok-4.1-fast:free",
    api_key=os.getenv("OPENROUTER_KEY"),
    base_url="https://openrouter.ai/api/v1",
)


browser = PlaywrightBrowser()

testingAgent = TestingAgent(
    llm=llm,
    browser=browser
)

# prompt = """
# Login in as the standard user and buy a bike light. Use any random but believable info when checking out.
# """
prompt = "Login in as the standard user"

url = "https://www.saucedemo.com/"

code, success = testingAgent.start(prompt, url)
