from __future__ import annotations

from typing import Literal, Optional
from pydantic import Field

from .base import MiscAction
from .types import Misc


class Validate(MiscAction):
    """Request a validation check on the current page.
    
    ALWAYS emit this action when the test step requests a validation,
    assertion, or check — do not attempt to validate from your own observation.
    A separate agent with deeper page access performs the check

    Emit AFTER the interaction that produces the state to validate.
    """
    action_type: Literal[Misc.VALIDATE] = Field(default=Misc.VALIDATE, exclude=True)

    assertion: str = Field(
        description=(
            "The claim to verify, as a positive statement of what should be true. "
            "Good: 'the cart badge shows the number 3'. "
            "Bad: 'check the cart' (not falsifiable), "
        ),
        min_length=1,
    )

    context: Optional[str] = Field(
        default=None,
        description=(
            "Optional one-sentence note on what you just did, to help the "
            "validation agent focus. Omit if the assertion is self-explanatory."
        ),
    )
