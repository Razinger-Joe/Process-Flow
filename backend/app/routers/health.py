"""
ProcessFlow Studio — Health Router

Simple health-check endpoint for monitoring and load balancers.
"""

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Return service health status and version."""
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }
