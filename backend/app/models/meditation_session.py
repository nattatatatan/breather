from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Text, String, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base
from app.models.practice_mode import PracticeMode
from app.models.session_visibility import SessionVisibility

class MeditationSession(Base):
    __tablename__ = "meditation_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Add proper User FK later when authentication exists.
    user_id: Mapped[int | None] = mapped_column(
        nullable=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    duration_seconds: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    mode: Mapped[PracticeMode] = mapped_column(
        SQLEnum(PracticeMode),
        nullable=False,
    )

    intent_id: Mapped[int | None] = mapped_column(
        ForeignKey("intents.id"),
        nullable=True,
    )

    feeling: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    visibility: Mapped[SessionVisibility] = mapped_column(
        SQLEnum(SessionVisibility),
        nullable=False,
        default=SessionVisibility.PRIVATE,
    )

    intent = relationship("Intent")

    elements = relationship(
        "SessionElement",
        back_populates="session",
        cascade="all, delete-orphan",
    )