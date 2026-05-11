from pydantic import BaseModel, Field
from src.base.schemas import Cookie


class TestCaseBase(BaseModel):
	name: str
	description: str = ""
	preconditions: str = ""
	objectives: str = ""
	base_url: str
	instruction: str
	executable_steps: list[dict] | None = None


class TestCaseRead(TestCaseBase):
	id: int
	testsuite_id: int
	cookies: list[Cookie] = []


class TestCaseCreate(BaseModel):
	name: str
	description: str = ""
	base_url: str
	instruction: str
	preconditions: str = ""
	objectives: str = ""


class TestCaseUpdate(BaseModel):
	name: str | None = None
	description: str | None = None
	base_url: str | None = None
	instruction: str | None = None
	preconditions: str = ""
	objectives: str = ""
