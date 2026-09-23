from datetime import datetime

from pydantic import BaseModel

from app.models.practice_mode import PracticeMode
from app.models.session_visibility import SessionVisibility


class MeditationSessionCreate(BaseModel):
    element_ids: list[int]
    mode: PracticeMode
    intent_id: int | None = None


class MeditationSessionUpdate(BaseModel):
    completed_at: datetime | None = None
    mode: str | None = None
    feeling: str | None = None
    note: str | None = None
    visibility: SessionVisibility | None = None


class MeditationSessionResponse(BaseModel):
    id: int
    started_at: datetime
    completed_at: datetime | None
    duration_seconds: int | None
    mode: PracticeMode
    intent_id: int | None
    feeling: str | None
    note: str | None
    visibility: SessionVisibility
    element_ids: list[int]

    model_config = {
        "from_attributes": True,
    }