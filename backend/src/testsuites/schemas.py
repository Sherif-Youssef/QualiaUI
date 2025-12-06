from pydantic import BaseModel, Field


class TestSuiteBase(BaseModel):
    name: str


class TestSuiteRead(TestSuiteBase):
    id: int


class TestSuiteCreate(TestSuiteBase):
    ...


class TestSuiteUpdate(TestSuiteBase):
    ...
