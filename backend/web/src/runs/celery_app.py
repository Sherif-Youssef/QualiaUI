from celery import Celery
from celery.signals import worker_init
from src.config import settings

app = Celery(
    "qualia_runs",
    broker=settings.CELERY_BROKER,
    backend=settings.CELERY_BACKEND,
    include=["src.runs.tasks"],
)

@worker_init.connect
def import_all_models(**kwargs):
    from src.auth.models import User
    from src.projects.models import Project, UserProjectLink
    from src.testsuites.models import TestSuite
    from src.testcases.models import TestCase
    from src.runs.models import ProjectRun, TestSuiteRun, TestCaseRun, TestStepRun