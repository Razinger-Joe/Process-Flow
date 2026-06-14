"""
ProcessFlow Studio — RunRecord Pydantic Schemas

Defines schemas for workflow execution runs and their logging status.
"""

from datetime import datetime
import uuid
from pydantic import BaseModel, Field


class LogLine(BaseModel):
    """Schema for individual log entries within a run."""
    id: str
    timestamp: str
    nodeId: str | None = None
    level: str = "info"  # info, warning, error, success
    message: str


class RunRecordOut(BaseModel):
    """Schema for returning workflow run results and logs."""
    id: uuid.UUID
    workflow_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    logs: list[dict] = Field(default_factory=list)  # list of logs (each log line conforms to LogLine)
    result: dict | None = None

    model_config = {
        "from_attributes": True
    }
