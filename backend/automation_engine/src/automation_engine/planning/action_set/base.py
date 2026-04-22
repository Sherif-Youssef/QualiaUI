from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from automation_engine.actions import BaseAction, TerminationSignal


class ActionSet(BaseModel):
    """Defines which action/termination types the LLM can emit."""
    model_config = ConfigDict(frozen=True)

    name: str
    actions: tuple[type[BaseAction], ...]
    terminations: tuple[type[TerminationSignal], ...] = Field(default_factory=lambda: ())
    description: str = ""

    @property
    def all_types(self) -> tuple[type, ...]:
        return self.actions + self.terminations
    
    def __contains__(self, item: type) -> bool:
        return item in self.all_types

    def __len__(self) -> int:
        return len(self.all_types)
