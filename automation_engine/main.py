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

prompt = """
Signup on the website with random name, email, etc as an admin,
look for Egyptian Foul Medames and go to its page,
edit its name making it 'Heshamian Steak' and add it to your favourites.
Make sure that the item appears in your favourites list.
"""

url = "http://127.0.0.1:8000/"

code, success = testingAgent.start(prompt, url)
