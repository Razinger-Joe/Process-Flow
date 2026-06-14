"""
ProcessFlow Studio — RunRecord ORM Model

Tracks the execution of a workflow — status, timing,
log lines (as JSONB), and final output data.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RunRecord(Base):
    """RunRecord — one execution of a workflow."""

    __tablename__ = "run_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="idle",
        doc="One of: idle, running, success, error",
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    logs: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        doc="Array of LogLine objects: [{id, timestamp, nodeId, ...}]",
    )
    result: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Final output data from the last node",
    )

    # ---- Relationships ----
    workflow: Mapped["Workflow"] = relationship(
        "Workflow",
        back_populates="runs",
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="runs",
    )

    def __repr__(self) -> str:
        return f"<RunRecord {self.id} status={self.status}>"
