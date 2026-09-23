from datetime import datetime

from pydantic import BaseModel, Field

from app.models.environment import Environment
from app.models.practice_mode import PracticeMode
from app.models.session_visibility import SessionVisibility
from app.models.sound import Sound


class MeditationSessionCreate(BaseModel):
    element_ids: list[int]
    mode: PracticeMode
    intent_id: int | None = None
    planned_seconds: int = Field(ge=60, le=10800)
    environment: Environment
    sound: Sound
    timer_visible: bool


class MeditationSessionUpdate(BaseModel):
    note: str | None = Field(default=None, max_length=2000)
    feeling: str | None = None
    visibility: SessionVisibility | None = None


class MeditationSessionComplete(BaseModel):
    returns: list[int]


class MeditationSessionResponse(BaseModel):
    id: int
    started_at: datetime
    completed_at: datetime | None
    duration_seconds: int | None
    planned_seconds: int
    mode: PracticeMode
    intent_id: int | None
    element_ids: list[int]
    environment: Environment
    sound: Sound
    timer_visible: bool
    returns: list[int]
    note: str | None
    feeling: str | None
    visibility: SessionVisibility
    thread_id: int | None

    model_config = {
        "from_attributes": True,
    }
