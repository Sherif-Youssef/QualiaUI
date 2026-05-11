from pydantic import BaseModel, Field
from src.base.schemas import Cookie


class TestSuiteBase(BaseModel):
    name: str
    description: str = ""


class TestSuiteRead(TestSuiteBase):
    id: int
    project_id: int
    cookies: list[Cookie] = []


class TestSuiteCreate(TestSuiteBase):
    ...


class TestSuiteUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
