"""
ProcessFlow Studio — FastAPI Application Entry Point

Creates the FastAPI app instance, configures CORS middleware,
and registers all API routers under /api/v1.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


# =============================================================
# Lifespan — startup/shutdown hooks
# =============================================================
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Handle application startup and shutdown events."""
    # ---- Startup ----
    print(f"🚀 ProcessFlow Studio v{settings.APP_VERSION} starting...")
    print(f"   Environment: {settings.ENVIRONMENT}")
    yield
    # ---- Shutdown ----
    print("👋 ProcessFlow Studio shutting down...")


# =============================================================
# App instance
# =============================================================
app = FastAPI(
    title="ProcessFlow Studio",
    description="Visual workflow automation engine — design, execute, and monitor business process automations.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)


# =============================================================
# CORS middleware
# =============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# =============================================================
# Router registration
# =============================================================
from app.routers import auth, workflows, runs, health  # noqa: E402

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
app.include_router(runs.router, prefix="/api/v1/runs", tags=["Runs"])
