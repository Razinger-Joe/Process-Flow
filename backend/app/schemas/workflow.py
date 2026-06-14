"""
ProcessFlow Studio — Workflow Pydantic Schemas

Defines schemas for creating, updating, and returning workflows.
"""

from datetime import datetime
import uuid
from pydantic import BaseModel, Field


class WorkflowBase(BaseModel):
    """Base schema for Workflow data fields."""
    name: str = Field(min_length=1, max_length=256)
    description: str | None = Field(default=None)
    definition: dict = Field(
        default_factory=dict,
        description="Visual graph definition containing nodes and edges: { nodes: [...], edges: [...] }"
    )


class WorkflowCreate(WorkflowBase):
    """Schema for creating a new workflow."""
    pass


class WorkflowUpdate(BaseModel):
    """Schema for updating an existing workflow."""
    name: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = Field(default=None)
    definition: dict | None = Field(default=None)
    is_active: bool | None = Field(default=None)


class WorkflowOut(WorkflowBase):
    """Schema for workflow details output returned by APIs."""
    id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
