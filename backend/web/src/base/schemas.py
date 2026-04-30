from enum import StrEnum

from typing import Generic, TypeVar, List, Optional, ClassVar, Any

from sqlalchemy import inspect, Column
from sqlalchemy.sql.elements import ColumnElement
from fastapi import Query
from pydantic import BaseModel
from sqlmodel import SQLModel
from enum import Enum

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    total_items: int
    items: List[T]
    offset: int
    limit: int


class PaginationParams:
    def __init__(
        self,
        offset: int = Query(0, ge=0),
        limit: int = Query(25, ge=1, le=100),
    ):
        self.offset = offset
        self.limit = limit
 

class RoleEnum(Enum):
	@property
	def value(self):
		return self._value_[0]

	@property
	def weight(self):
		return self._value_[1]

	@classmethod
	def _missing_(cls, value):
		for member in cls:
			if member._value_[0] == value:
				return member
		return None

	def __lt__(self, other):
		if isinstance(other, RoleEnum):
			return self.weight < other.weight
		return NotImplemented

	def __le__(self, other):
		if isinstance(other, RoleEnum):
			return self.weight <= other.weight
		return NotImplemented

	def __gt__(self, other):
		if isinstance(other, RoleEnum):
			return self.weight > other.weight
		return NotImplemented

	def __ge__(self, other):
		if isinstance(other, RoleEnum):
			return self.weight >= other.weight
		return NotImplemented

	def __eq__(self, other):
		if isinstance(other, RoleEnum):
			return self.weight == other.weight
		return NotImplemented

	def __hash__(self):
		return hash(self._name_)

	def __int__(self):
		return self.weight
    
	def __repr__(self):
		return "'%s'" % self._value_[0]


class Scope(StrEnum):
    TESTCASE = "TESTCASE"
    TESTSUITE = "TESTSUITE"
    PROJECT = "PROJECT"
