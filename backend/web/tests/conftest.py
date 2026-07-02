"""
Root test configuration.

Environment variables are set BEFORE any src.* imports because
pydantic-settings singletons (settings, auth_settings) instantiate
at module-import time.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "15")
os.environ.setdefault("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "60")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")
os.environ.setdefault("AWS_REGION", "us-east-1")

import pytest
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.main import app
from src.database import get_session
from src.auth.models import User, Role as AuthRole
from src.auth.service import hash_password
from src.projects.models import Project, UserProjectLink, Role as ProjectRole
from src.testsuites.models import TestSuite
from src.testcases.models import TestCase
from src.llms.models import Provider, LLMModel
from src.llms.schemas import ProviderType
from src.runs.models import TestCaseRun, TestSuiteRun, RunMode, RunStatus
from src.base.schemas import Scope


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(name="engine", scope="session")
def engine_fixture():
    """Single in-memory SQLite engine for the test session.

    StaticPool + check_same_thread=False are required because TestClient
    runs the ASGI app in a separate thread, but SQLite in-memory DBs
    are normally bound to the creating thread.
    """
    engine = create_engine(
        "sqlite://",
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    """
    Per-test database session wrapped in a transaction that is
    rolled back after the test, so every test starts with a clean DB.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(name="client")
def client_fixture(session):
    """FastAPI TestClient that uses the test session."""
    def _get_test_session():
        yield session

    app.dependency_overrides[get_session] = _get_test_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------

def make_user(
    session: Session,
    *,
    username: str = "testuser",
    email: str = "test@example.com",
    password: str = "Test1234!",
    first_name: str = "Test",
    last_name: str = "User",
    role: AuthRole = AuthRole.VIEWER,
    is_active: bool = True,
    is_temp_pass: bool = False,
) -> User:
    """Insert a user into the DB and return it. Plain function, not a fixture."""
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
        is_active=is_active,
        is_temp_pass=is_temp_pass,
    )
    session.add(user)
    session.flush()
    return user


def make_project(
    session: Session,
    *,
    name: str = "Test Project",
    description: str = "",
    members: list[tuple[User, ProjectRole]] | None = None,
) -> Project:
    """Insert a project into the DB, optionally with member links."""
    project = Project(name=name, description=description)
    session.add(project)
    session.flush()

    if members:
        for user, role in members:
            link = UserProjectLink(
                user_id=user.id,
                project_id=project.id,
                role=role,
            )
            session.add(link)
        session.flush()
        session.expire(project, ["users_links"])

    return project


def make_testsuite(
    session: Session,
    project: Project,
    *,
    name: str = "Test Suite",
    description: str = "",
) -> TestSuite:
    """Insert a testsuite under the given project and return it."""
    testsuite = TestSuite(
        name=name,
        description=description,
        project_id=project.id,
    )
    session.add(testsuite)
    session.flush()
    return testsuite


def make_testcase(
    session: Session,
    testsuite: TestSuite,
    *,
    name: str = "Test Case",
    description: str = "",
    base_url: str = "https://example.com",
    instruction: str = "Navigate to the homepage",
) -> TestCase:
    """Insert a testcase under the given testsuite and return it."""
    testcase = TestCase(
        name=name,
        description=description,
        base_url=base_url,
        instruction=instruction,
        testsuite_id=testsuite.id,
    )
    session.add(testcase)
    session.flush()
    return testcase


def make_provider(
    session: Session,
    *,
    display_name: str = "Test Provider",
    provider_type: ProviderType = ProviderType.OPENAI,
    base_url: str | None = None,
    api_key: str | None = None,
    additional_config: dict | None = None,
) -> Provider:
    """Insert an LLM provider and return it."""
    provider = Provider(
        display_name=display_name,
        provider_type=provider_type,
        base_url=base_url,
        api_key=api_key,
        additional_config=additional_config or {},
    )
    session.add(provider)
    session.flush()
    return provider


def make_llm_model(
    session: Session,
    provider: Provider,
    *,
    model_name: str = "gpt-4o",
    display_name: str = "GPT-4o",
) -> LLMModel:
    """Insert an LLM model under the given provider and return it."""
    model = LLMModel(
        model_name=model_name,
        display_name=display_name,
        provider_id=provider.id,
    )
    session.add(model)
    session.flush()
    return model


def make_testsuite_run(
    session: Session,
    testsuite: TestSuite,
    user: User | None = None,
    llm_model: LLMModel | None = None,
    *,
    job_uid: str = "uid_123",
    mode: RunMode = RunMode.EXECUTABLE,
    status: RunStatus = RunStatus.QUEUED,
) -> TestSuiteRun:
    """Insert a testsuite run and return it."""
    run = TestSuiteRun(
        testsuite_id=testsuite.id,
        name=testsuite.name,
        mode=mode,
        job_uid=job_uid,
        status=status,
        user_id=user.id if user else None,
        llm_model_id=llm_model.id if llm_model else None,
    )
    session.add(run)
    session.flush()
    return run


def make_testcase_run(
    session: Session,
    testcase: TestCase,
    testsuite_run: TestSuiteRun | None = None,
    user: User | None = None,
    llm_model: LLMModel | None = None,
    *,
    job_uid: str = "uid_1234",
    mode: RunMode = RunMode.EXECUTABLE,
    status: RunStatus = RunStatus.QUEUED,
) -> TestCaseRun:
    """Insert a testcase run and return it."""
    run = TestCaseRun(
        testcase_id=testcase.id,
        testsuite_run_id=testsuite_run.id if testsuite_run else None,
        name=testcase.name,
        base_url=testcase.base_url,
        instruction=testcase.instruction,
        mode=mode,
        job_uid=job_uid,
        status=status,
        user_id=user.id if user else None,
        llm_model_id=llm_model.id if llm_model else None,
    )
    session.add(run)
    session.flush()
    return run
