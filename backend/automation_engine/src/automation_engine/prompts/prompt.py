from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate
)
from pathlib import Path

parent  = Path(__file__).parent.resolve() 

with open(parent / "system.md", "r") as f:
    system_template_str = f.read().strip()

with open(parent / "human.md", "r") as f:
    human_template_str = f.read().strip()

prompt_template = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(system_template_str), 
        HumanMessagePromptTemplate.from_template(human_template_str)
    ]
)