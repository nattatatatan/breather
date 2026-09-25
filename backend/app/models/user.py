from datetime import date, datetime

from sqlalchemy import Date, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from app.db.db import Base

from app.models.visibility import Visibility

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    auth_provider_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    display_name: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )

    practising_since: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    location: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )

    bio: Mapped[str | None] = mapped_column(
        String(280),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    visibility: Mapped[Visibility] = mapped_column(
        SQLEnum(Visibility),
        nullable=False,
        default=Visibility.PUBLIC,
    )

    practice_profile = relationship(
        "PracticeProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
