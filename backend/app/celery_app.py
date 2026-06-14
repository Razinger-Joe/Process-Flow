"""
ProcessFlow Studio — Celery Application

Initializes Celery and configures it with Redis for async task execution.
"""

from celery import Celery
from app.config import settings

celery_app = Celery(
    "processflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks"],
)

# Optional configurations
celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
