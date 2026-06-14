"""
ProcessFlow Studio — Database Connection

Provides the async SQLAlchemy engine, session factory,
and declarative Base class used by all ORM models.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# =============================================================
# Engine — async PostgreSQL connection pool
# =============================================================
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_development,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)


# =============================================================
# Session factory — creates per-request database sessions
# =============================================================
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# =============================================================
# Base — all ORM models inherit from this
# =============================================================
class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy ORM models."""
    pass


# =============================================================
# Dependency — yields an async session for FastAPI routes
# =============================================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.

    Usage in a route:
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
