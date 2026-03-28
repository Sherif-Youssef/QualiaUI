import os
from collections.abc import Generator
from datetime import timedelta
from typing import Callable, cast

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "15")
os.environ.setdefault("JWT_REFRESH_TOKEN_EXPIRATION_MINUTES", "120")

from src.auth.models import Role as UserRole, User 
from src.auth.dependencies import require_active_user, require_non_temporary_password
from src.auth.router import router as auth_router
from src.auth.schemas import TokenType
from src.auth.service import create_token
from src.projects.models import Project, Role as ProjectRole, UserProjectLink
from src.projects.router import router as projects_router
from src.testsuites.models import TestSuite
from src.testsuites.router import router as testsuites_router
from src.testcases.models import TestCase
from src.testcases.router import router as testcases_router
from src.runs.active.router import router as active_router
from src.runs.history.router import router as history_router

from src.database import get_session


@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as s:
        yield s


@pytest.fixture()
def user_factory(session: Session) -> Callable[..., User]:
    def _create_user(
        username: str,
        email: str,
        role: UserRole = UserRole.VIEWER,
        is_active: bool = True,
    ) -> User:
        user = User(
            first_name="Test",
            last_name="User",
            username=username,
            email=email,
            hashed_password="hashed",
            role=role,
            is_active=is_active,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    return _create_user


@pytest.fixture()
def project_factory(session: Session) -> Callable[..., Project]:
    def _create_project(name: str = "Project One", description: str = "") -> Project:
        project = Project(name=name, description=description)
        session.add(project)
        session.commit()
        session.refresh(project)
        return project

    return _create_project


@pytest.fixture()
def project_link_factory(session: Session) -> Callable[..., UserProjectLink]:
    def _link(user_id: int, project_id: int, role: ProjectRole) -> UserProjectLink:
        link = UserProjectLink(user_id=user_id, project_id=project_id, role=role)
        session.add(link)
        session.commit()
        session.refresh(link)
        return link

    return _link


@pytest.fixture()
def testsuite_factory(session: Session) -> Callable[..., TestSuite]:
    def _create_testsuite(
        project_id: int,
        name: str = "Suite One",
        description: str = "",
    ) -> TestSuite:
        testsuite = TestSuite(project_id=project_id, name=name, description=description)
        session.add(testsuite)
        session.commit()
        session.refresh(testsuite)
        return testsuite

    return _create_testsuite


@pytest.fixture()
def testcase_factory(session: Session) -> Callable[..., TestCase]:
    def _create_testcase(
        testsuite_id: int,
        name: str = "Test One",
        description: str = "",
        base_url: str = "https://example.com",
        instruction: str = "Go to homepage",
    ) -> TestCase:
        testcase = TestCase(
            testsuite_id=testsuite_id,
            name=name,
            description=description,
            base_url=base_url,
            instruction=instruction,
        )
        session.add(testcase)
        session.commit()
        session.refresh(testcase)
        return testcase

    return _create_testcase


@pytest.fixture()
def client(session: Session) -> Generator[TestClient, None, None]:
    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(projects_router, prefix="/api/v1")
    app.include_router(testsuites_router, prefix="/api/v1")
    app.include_router(testcases_router, prefix="/api/v1")
    app.include_router(active_router, prefix="/api/v1/projects/{project_id}/runs")
    app.include_router(history_router, prefix="/api/v1/projects/{project_id}/runs")

    def _override_get_session() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = _override_get_session

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def auth_header_factory() -> Callable[[User], dict[str, str]]:
    def _auth_header(user: User) -> dict[str, str]:
        token = create_token(
            user_id=user.id,  # pyright: ignore[reportArgumentType]
            token_type=TokenType.ACCESS,
            expires_delta=timedelta(minutes=30),
        )
        return {"Authorization": f"Bearer {token}"}

    return _auth_header


@pytest.fixture()
def override_current_user(client: TestClient):
    app = cast(FastAPI, client.app)

    def _override(user: User) -> None:
        app.dependency_overrides[require_non_temporary_password] = lambda: user
        app.dependency_overrides[require_active_user] = lambda: user

    yield _override
    app.dependency_overrides.pop(require_non_temporary_password, None)
    app.dependency_overrides.pop(require_active_user, None)
