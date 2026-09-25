from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.environment import Environment
from app.models.practice_mode import PracticeMode
from app.models.sound import Sound
from app.models.visibility import Visibility


class PracticeProfileSchema(BaseModel):
    mode: PracticeMode
    intent_id: int
    element_id: int
    environment: Environment
    duration_seconds: int = Field(ge=60, le=10800)
    sound: Sound
    timer_visible: bool

    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    id: int
    display_name: str
    practising_since: date
    location: str | None
    bio: str | None
    created_at: datetime
    practice: PracticeProfileSchema | None
    visibility: Visibility

    model_config = {"from_attributes": True}


class MeUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=40)
    practising_since: date | None = None
    location: str | None = Field(default=None, max_length=80)
    bio: str | None = Field(default=None, max_length=280)
    visibility: Visibility | None = None


class ModeSplitItem(BaseModel):
    mode: PracticeMode
    seconds: int


class ByElementItem(BaseModel):
    element_id: int
    seconds: int


class PracticeStats(BaseModel):
    total_seconds: int
    longest_seconds: int
    session_count: int
    shared_count: int
    current_streak_days: int
    month_seconds: int
    mode_split: list[ModeSplitItem]
    by_element: list[ByElementItem]
