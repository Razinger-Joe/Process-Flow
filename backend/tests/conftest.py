"""
ProcessFlow Studio — Test Suite Configuration

Defines database and client fixtures for testing FastAPI async endpoints.
Uses an in-memory SQLite database for zero-config test execution speed.
"""

import asyncio
from collections.abc import AsyncGenerator
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.database import Base, get_db
from app.main import app

# 1. Database Configuration for Testing (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite multithreaded test runs
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    """Create all schema tables before starting the test suite run."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session and clean transaction for each test case."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Yield a HTTP test client with database dependencies overridden."""
    async def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    # Use ASGITransport instead of deprecated app parameter in httpx.AsyncClient
    async with AsyncClient(
        transport=ASGITransport(app), 
        base_url="http://testserver"
    ) as ac:
        yield ac
        
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_celery_delay(monkeypatch):
    """Mock Celery task delay method to avoid hanging on connection to offline Redis."""
    from app.tasks import run_workflow_task
    monkeypatch.setattr(run_workflow_task, "delay", lambda *args, **kwargs: None)

