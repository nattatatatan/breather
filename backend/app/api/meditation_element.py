from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.db import get_db
from app.models.meditation_element import MeditationElement
from app.schemas.meditation_element import MeditationElementResponse

router = APIRouter(
    prefix="/api/elements",
    tags=["meditation-elements"],
)

@router.get(
    "",
    response_model=list[MeditationElementResponse],
)
def get_elements(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(MeditationElement)
        .order_by(MeditationElement.name)
    ).all()
