from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.db import Base


class Intent(Base):
    __tablename__ = "intents"

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

    description: Mapped[str | None]