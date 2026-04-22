from ..action_set.presets import FULL, INTERACTIVE, ASSERTION
from .single_step import SingleStepMode
from .action_group import ActionGroupMode

SINGLE_FULL = SingleStepMode(FULL)
SINGLE_INTERACTIVE = SingleStepMode(INTERACTIVE)
SINGLE_ASSERTION = SingleStepMode(ASSERTION)

GROUP_FULL = ActionGroupMode(FULL)
GROUP_INTERACTIVE = ActionGroupMode(INTERACTIVE)
GROUP_ASSERTION = ActionGroupMode(ASSERTION)
