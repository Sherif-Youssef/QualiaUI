from typing import Optional, Literal, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import Enum as SAEnum
from .schemas import SameSite

if TYPE_CHECKING:
    from src.testcases.models import TestCase
    from src.testsuites.models import TestSuite

class Cookie(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    value: str
    url: Optional[str] = Field(default=None, nullable=True)
    domain: Optional[str] = Field(default=None, nullable=True)
    path: Optional[str] = Field(default=None, nullable=True)
    expires: Optional[float] = Field(default=None, nullable=True)
    httpOnly: Optional[bool] = Field(default=None, nullable=True)
    secure: Optional[bool] = Field(default=None, nullable=True)
    sameSite: Optional[SameSite] = Field(
        default=None,
        sa_column=Column(SAEnum(SameSite, values_callable=lambda x: [e.value for e in x], name="samesite"), nullable=True)
    )
    partitionKey: Optional[str] = Field(default=None, nullable=True)

    testcase_id: int | None = Field(default=None, foreign_key="testcase.id", ondelete="CASCADE")
    testsuite_id: int | None = Field(default=None, foreign_key="testsuite.id", ondelete="CASCADE")

    testcase: Optional["TestCase"] = Relationship(back_populates="cookies")
    testsuite: Optional["TestSuite"] = Relationship(back_populates="cookies")