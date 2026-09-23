from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base


class ReplyHelpful(Base):
    __tablename__ = "reply_helpful"

    __table_args__ = (
        UniqueConstraint(
            "reply_id",
            "user_id",
            name="uq_reply_helpful_user",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    reply_id: Mapped[int] = mapped_column(
        ForeignKey("replies.id"),
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    reply = relationship("Reply", back_populates="helpful_marks")
