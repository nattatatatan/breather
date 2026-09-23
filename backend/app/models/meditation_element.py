from sqlalchemy import Enum as SQLEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.db import Base
from app.models.domain import Domain


class MeditationElement(Base):
    __tablename__ = "meditation_elements"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    domain: Mapped[Domain | None] = mapped_column(
            SQLEnum(Domain),
            nullable=True,
        )

    description: Mapped[str | None]

    image_url: Mapped[str | None]

    sessions = relationship(
        "SessionElement",
        back_populates="element",
    )
