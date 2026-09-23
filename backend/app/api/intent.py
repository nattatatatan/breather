from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.db import get_db
from app.models.intent import Intent
from app.schemas.intent import IntentResponse

router = APIRouter(prefix="/api/intents", tags=["intents"])

@router.get("", response_model=list[IntentResponse])
def get_intents(db: Session = Depends(get_db)):
    return db.scalars(
        select(Intent).order_by(Intent.name)
    ).all()
