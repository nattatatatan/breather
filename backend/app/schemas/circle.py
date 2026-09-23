from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.environment import Environment
from app.models.practice_mode import PracticeMode
from app.models.sound import Sound
from app.schemas.me import PracticeStats


class AuthorSummary(BaseModel):
    id: int
    display_name: str
    initial: str
    practising_since: date
    total_seconds: int
    primary_mode: PracticeMode | None
    primary_element_id: int | None


class AttachedSitting(BaseModel):
    session_id: int
    started_at: datetime
    mode: PracticeMode
    element_id: int
    intent_id: int | None
    duration_seconds: int
    return_count: int


class ThreadSummary(BaseModel):
    id: int
    author: AuthorSummary
    title: str
    excerpt: str
    created_at: datetime
    mode: PracticeMode | None
    element_id: int | None
    attached: AttachedSitting | None
    reply_count: int
    long_practitioner_reply_count: int


class Reply(BaseModel):
    id: int
    author: AuthorSummary
    body: str
    created_at: datetime
    helpful_count: int
    marked_helpful_by_me: bool
    read_context: bool


class ThreadDetail(ThreadSummary):
    body: str
    replies: list[Reply]


class ThreadCreate(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    body: str = Field(min_length=1, max_length=5000)
    mode: PracticeMode | None = None
    element_id: int | None = None
    session_id: int | None = None


class ReplyCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class HelpfulState(BaseModel):
    helpful_count: int
    marked_helpful_by_me: bool


class SharedSitting(BaseModel):
    session_id: int
    author: AuthorSummary
    started_at: datetime
    mode: PracticeMode
    intent_id: int | None
    element_id: int
    duration_seconds: int
    planned_seconds: int
    environment: Environment
    sound: Sound
    timer_visible: bool
    returns: list[int]
    note: str | None
    thread_id: int | None


class Practitioner(BaseModel):
    author: AuthorSummary
    location: str | None
    bio: str | None
    stats: PracticeStats
    shared_sittings: list[AttachedSitting]
    open_thread_id: int | None


class HoursEntry(BaseModel):
    rank: int
    user_id: int
    display_name: str
    seconds: int
    is_me: bool


class Hours(BaseModel):
    month: str
    entries: list[HoursEntry]
    me: HoursEntry | None
    sitting_now: int
