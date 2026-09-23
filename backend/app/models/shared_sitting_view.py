from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.db import Base


class SharedSittingView(Base):
    __tablename__ = "shared_sitting_views"

    __table_args__ = (
        Index(
            "ix_shared_sitting_views_session_viewer",
            "session_id",
            "viewer_id",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    viewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    session_id: Mapped[int] = mapped_column(
        ForeignKey("meditation_sessions.id"),
        nullable=False,
    )

    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
