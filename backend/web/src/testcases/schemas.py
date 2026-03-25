from pydantic import BaseModel, Field


class TestCaseBase(BaseModel):
	name: str
	description: str = ""
	base_url: str
	instruction: str
	executable_steps: list[dict] | None = None


class TestCaseRead(TestCaseBase):
	id: int
	testsuite_id: int


class TestCaseCreate(BaseModel):
	name: str
	description: str = ""
	base_url: str
	instruction: str


class TestCaseUpdate(BaseModel):
	name: str | None = None
	description: str | None = None
	base_url: str | None = None
	instruction: str | None = None
