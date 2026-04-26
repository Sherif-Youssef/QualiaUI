from __future__ import annotations

from typing import ClassVar
from pydantic import BaseModel, ConfigDict


class VerbosityProfile(BaseModel):
    """
    Collected parameter overrides driven by a single verbosity level.
    """
    model_config = ConfigDict(frozen=True)

    node_perc: int
    min_nodes: int

    max_total_chars: int
    max_text_length: int

    _BOUNDS: ClassVar[dict] = {
        "node_perc": (20.0, 100.0),
        "min_nodes": (50, 1500),
        "max_total_chars": (5000, 30000),
        "max_text_length": (40, 500),
    }

    @classmethod
    def from_percentage(cls, pct: float) -> VerbosityProfile:
        """
        Build a profile by interpolating between min and max bounds.

        pct=0.0 gives the most compressed output.
        pct=1.0 gives the most detailed output.
        """
        p = max(0.0, min(1.0, pct))

        def lerp(key: str) -> float:
            lo, hi = cls._BOUNDS[key]
            return lo + p * (hi - lo)

        kwargs = {}
        for field_name in cls.model_fields.keys():
            kwargs[field_name] = lerp(field_name)
        
        return cls(**kwargs)
