"""
ProcessFlow Studio — Runs Router

Defines endpoints for triggering workflow runs and inspecting execution history/logs.
"""

from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.models.run import RunRecord
from app.schemas.run import RunRecordOut
from app.services.auth_service import get_current_user

# Import the celery task for async execution
from app.tasks import run_workflow_task

router = APIRouter()


@router.post(
    "/{workflow_id}/trigger",
    response_model=RunRecordOut,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger execution run of a workflow",
)
async def trigger_run(
    workflow_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Creates a new RunRecord in the database and triggers the background Celery task
    for node-by-node execution. Falls back to FastAPI BackgroundTasks if Redis is offline.
    """
    # Verify workflow exists and belongs to current user
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to run it.",
        )

    # Create run record
    new_run = RunRecord(
        workflow_id=workflow_id,
        user_id=current_user.id,
        status="idle",
        logs=[],
    )
    db.add(new_run)
    await db.flush()

    # Trigger Celery execution asynchronously, fallback to BackgroundTasks if offline
    try:
        run_workflow_task.delay(str(new_run.id))
        print(f"INFO: Successfully dispatched run {new_run.id} to Celery worker.")
    except Exception as exc:
        print(f"WARNING: Redis/Celery offline ({exc}). Executing via FastAPI BackgroundTasks.")
        background_tasks.add_task(run_workflow_task, str(new_run.id))

    return new_run


@router.get(
    "/workflow/{workflow_id}",
    response_model=list[RunRecordOut],
    summary="Get execution run history for a workflow",
)
async def get_workflow_runs(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Retrieve history of all runs for a specific workflow owned by the current user.
    """
    # Verify workflow ownership first
    result = await db.execute(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to view its runs.",
        )

    # Fetch run records
    runs_result = await db.execute(
        select(RunRecord)
        .where(RunRecord.workflow_id == workflow_id)
        .order_by(RunRecord.started_at.desc())
    )
    return runs_result.scalars().all()


@router.get(
    "/detail/{run_id}",
    response_model=RunRecordOut,
    summary="Get execution details and logs of a single run",
)
async def get_run_detail(
    run_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Retrieve status, logs, and results of a single execution run.
    """
    result = await db.execute(
        select(RunRecord).where(
            RunRecord.id == run_id,
            RunRecord.user_id == current_user.id,
        )
    )
    run_record = result.scalar_one_or_none()
    if not run_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run record not found or you do not have access.",
        )
    return run_record
