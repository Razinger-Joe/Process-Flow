"""
ProcessFlow Studio — Workflows Router

Defines CRUD endpoints for workflow resource management.
"""

from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowOut, WorkflowUpdate
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post(
    "/",
    response_model=WorkflowOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow canvas",
)
async def create_workflow(
    workflow_in: WorkflowCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new workflow canvas for the currently logged-in user.
    """
    new_workflow = Workflow(
        user_id=current_user.id,
        name=workflow_in.name,
        description=workflow_in.description,
        definition=workflow_in.definition,
    )
    db.add(new_workflow)
    await db.flush()
    return new_workflow


@router.get(
    "/",
    response_model=list[WorkflowOut],
    summary="List all workflows owned by the current user",
)
async def list_workflows(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Return all active workflows owned by the authenticated user.
    """
    result = await db.execute(
        select(Workflow)
        .where(Workflow.user_id == current_user.id, Workflow.is_active == True)
        .order_by(Workflow.created_at.desc())
    )
    return result.scalars().all()


@router.get(
    "/{workflow_id}",
    response_model=WorkflowOut,
    summary="Get workflow details by ID",
)
async def get_workflow(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fetch details of a single workflow. Checks ownership and checks that the workflow is active.
    """
    result = await db.execute(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to view it.",
        )
    return workflow


@router.put(
    "/{workflow_id}",
    response_model=WorkflowOut,
    summary="Update workflow meta info and canvas definition",
)
async def update_workflow(
    workflow_id: uuid.UUID,
    workflow_in: WorkflowUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update details (name, description, canvas nodes/edges) of a workflow. Validates ownership.
    """
    result = await db.execute(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to update it.",
        )

    # Apply updates
    update_data = workflow_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(workflow, field, val)

    await db.flush()
    return workflow


@router.delete(
    "/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a workflow by ID",
)
async def delete_workflow(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Soft-delete a workflow by setting is_active = False. Validates ownership.
    """
    result = await db.execute(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to delete it.",
        )

    # Perform soft-delete
    workflow.is_active = False
    await db.flush()
    return
