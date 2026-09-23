from sqlalchemy import Boolean, ForeignKey, Integer
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base
from app.models.environment import Environment
from app.models.practice_mode import PracticeMode
from app.models.sound import Sound


class PracticeProfile(Base):
    __tablename__ = "practice_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    mode: Mapped[PracticeMode] = mapped_column(
        SQLEnum(PracticeMode),
        nullable=False,
    )

    intent_id: Mapped[int] = mapped_column(
        ForeignKey("intents.id"),
        nullable=False,
    )

    element_id: Mapped[int] = mapped_column(
        ForeignKey("meditation_elements.id"),
        nullable=False,
    )

    environment: Mapped[Environment] = mapped_column(
        SQLEnum(Environment),
        nullable=False,
    )

    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    sound: Mapped[Sound] = mapped_column(
        SQLEnum(Sound),
        nullable=False,
    )

    timer_visible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    user = relationship("User", back_populates="practice_profile")
    intent = relationship("Intent")
    element = relationship("MeditationElement")
