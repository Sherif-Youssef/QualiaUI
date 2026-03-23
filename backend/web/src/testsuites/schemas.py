from pydantic import BaseModel, Field


class TestSuiteBase(BaseModel):
    name: str
    description: str = ""


class TestSuiteRead(TestSuiteBase):
    id: int
    project_id: int


class TestSuiteCreate(TestSuiteBase):
    ...


class TestSuiteUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
