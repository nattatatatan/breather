from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base
from app.models.practice_mode import PracticeMode


class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(primary_key=True)

    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(140), nullable=False)

    body: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    mode: Mapped[PracticeMode | None] = mapped_column(
        SQLEnum(PracticeMode),
        nullable=True,
    )

    element_id: Mapped[int | None] = mapped_column(
        ForeignKey("meditation_elements.id"),
        nullable=True,
    )

    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("meditation_sessions.id"),
        unique=True,
        nullable=True,
    )

    author = relationship("User")
    element = relationship("MeditationElement")
    session = relationship("MeditationSession", back_populates="thread")

    replies = relationship(
        "Reply",
        back_populates="thread",
        cascade="all, delete-orphan",
        order_by="Reply.created_at",
    )
