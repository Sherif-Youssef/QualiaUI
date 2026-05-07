from celery import Celery
from src.config import settings

app = Celery(
    "qualia_runs",
    broker=settings.CELERY_BROKER,
    backend=settings.CELERY_BACKEND,
    include=["src.runs.tasks"],
)