"""
ProcessFlow Studio — Workflow ORM Model

Represents a workflow created by a user.
The full node/edge definition is stored as JSONB
so the frontend canvas can be reconstructed from the DB.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Workflow(Base):
    """Workflow — stores the visual graph definition as JSONB."""

    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    definition: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        doc="Stores { nodes: [...], edges: [...] } as JSON",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Soft delete flag — False means deleted",
    )

    # ---- Relationships ----
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="workflows",
    )
    runs: Mapped[list["RunRecord"]] = relationship(
        "RunRecord",
        back_populates="workflow",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="desc(RunRecord.started_at)",
    )

    def __repr__(self) -> str:
        return f"<Workflow {self.name!r} ({self.id})>"
