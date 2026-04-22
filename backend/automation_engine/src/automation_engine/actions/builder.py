from typing import Annotated, Union
from pydantic import Discriminator


def build_action_union(actions: tuple[type, ...]):
    """Build a discriminated union type from action classes."""
    assert len(actions) > 0, "At least one action type required"
    if len(actions) == 1:
        return actions[0]
    return Annotated[Union[tuple(actions)], Discriminator("action_type")]


def build_termination_union(terminations: tuple[type, ...]):
    """Build a discriminated union type from termination classes."""
    assert len(terminations) > 0, "At least one termination type required"
    if len(terminations) == 1:
        return terminations[0]
    return Annotated[Union[tuple(terminations)], Discriminator("termination_type")]


def build_output_union(actions: tuple[type, ...], terminations: tuple[type, ...]):
    """Build a combined union of actions + terminations with a top-level discriminator."""
    all_types = actions + terminations
    assert len(all_types) > 0
    if len(all_types) == 1:
        return all_types[0]
    return Union[tuple(all_types)]
