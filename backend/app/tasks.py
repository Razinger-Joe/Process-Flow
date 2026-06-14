"""
ProcessFlow Studio — Celery Tasks

Async task definitions for out-of-process workflow execution runs.
"""

import asyncio
import uuid

from app.celery_app import celery_app
from app.database import async_session_factory
from app.services.execution_engine import WorkflowEngine


async def execute_engine_async(run_id: uuid.UUID) -> None:
    """Helper to run the async execution engine inside a database session context."""
    async with async_session_factory() as session:
        engine = WorkflowEngine(session)
        await engine.execute(run_id)


@celery_app.task(name="app.tasks.run_workflow_task")
def run_workflow_task(run_id_str: str) -> None:
    """
    Celery task that executes a workflow.
    Invoked asynchronously using: run_workflow_task.delay(str(run_id))
    """
    run_id = uuid.UUID(run_id_str)
    
    # Run the async execution loop synchronously inside the Celery worker process
    asyncio.run(execute_engine_async(run_id))
