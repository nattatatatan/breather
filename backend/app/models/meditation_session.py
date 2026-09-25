from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base
from app.models.environment import Environment
from app.models.practice_mode import PracticeMode
from backend.app.models.visibility import Visibility
from app.models.sound import Sound


class MeditationSession(Base):
    __tablename__ = "meditation_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
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

    planned_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    mode: Mapped[PracticeMode] = mapped_column(
        SQLEnum(PracticeMode),
        nullable=False,
    )

    intent_id: Mapped[int | None] = mapped_column(
        ForeignKey("intents.id"),
        nullable=True,
    )

    environment: Mapped[Environment] = mapped_column(
        SQLEnum(Environment),
        nullable=False,
        default=Environment.STILL,
    )

    sound: Mapped[Sound] = mapped_column(
        SQLEnum(Sound),
        nullable=False,
        default=Sound.SILENT,
    )

    timer_visible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    returns: Mapped[list[int]] = mapped_column(
        ARRAY(Integer),
        nullable=False,
        default=list,
    )

    feeling: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    visibility: Mapped[Visibility] = mapped_column(
        SQLEnum(Visibility),
        nullable=False,
        default=Visibility.PUBLIC,
    )

    user = relationship("User")
    intent = relationship("Intent")

    elements = relationship(
        "SessionElement",
        back_populates="session",
        cascade="all, delete-orphan",
    )

    thread = relationship(
        "Thread",
        back_populates="session",
        uselist=False,
    )
