from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base


class SessionElement(Base):
    __tablename__ = "session_elements"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "element_id",
            name="uq_session_element",
        ),
    )   

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("meditation_sessions.id"),
        nullable=False,
    )

    element_id: Mapped[int] = mapped_column(
        ForeignKey("meditation_elements.id"),
        nullable=False,
    )

    session = relationship(
        "MeditationSession",
        back_populates="elements",
    )

    element = relationship(
        "MeditationElement",
        back_populates="sessions",
    )