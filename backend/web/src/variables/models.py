from sqlmodel import SQLModel, Field


class Variable(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    project_id: int | None = Field(default=None, foreign_key="project.id", ondelete="CASCADE")
    testsuite_id: int | None = Field(default=None, foreign_key="testsuite.id", ondelete="CASCADE")
    testcase_id: int | None = Field(default=None, foreign_key="testcase.id", ondelete="CASCADE")

    name: str
    description: str = Field(default="")
    hidden: bool = Field(default=True)
    text_value: str
