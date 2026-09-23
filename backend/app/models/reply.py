from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base


class Reply(Base):
    __tablename__ = "replies"

    id: Mapped[int] = mapped_column(primary_key=True)

    thread_id: Mapped[int] = mapped_column(
        ForeignKey("threads.id"),
        nullable=False,
    )

    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    body: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # True when the replier had opened the thread's attached sitting
    # before writing this reply.
    read_context: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    thread = relationship("Thread", back_populates="replies")
    author = relationship("User")

    helpful_marks = relationship(
        "ReplyHelpful",
        back_populates="reply",
        cascade="all, delete-orphan",
    )
