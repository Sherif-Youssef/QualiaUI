from .agent import PlanningAgent

__all__ = [
    'PlanningAgent'
]

import logging
from datetime import datetime
import os

timestamp = datetime.now().isoformat().replace(":", "-")
log_folder = f"logs/{timestamp}"
os.makedirs(log_folder, exist_ok=True)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter(
    '{asctime} - {name} - Line {lineno} - {levelname} - {message}',
    style='{'
)

detailed_handler = logging.FileHandler( os.path.join(log_folder, "info.log") )
detailed_handler.setLevel(logging.DEBUG)
detailed_handler.setFormatter(formatter)

concise_handler = logging.FileHandler(os.path.join(log_folder, "debug.log"))
concise_handler.setLevel(logging.INFO)
concise_handler.setFormatter(formatter)

logger.addHandler(detailed_handler)
logger.addHandler(concise_handler)