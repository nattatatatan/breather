from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dep import get_current_user
from app.db.db import get_db
from app.models.intent import Intent
from app.models.meditation_element import MeditationElement
from app.models.practice_profile import PracticeProfile
from app.models.user import User
from app.schemas.me import MeResponse, MeUpdate, PracticeProfileSchema, PracticeStats
from app.services.stats import compute_stats

router = APIRouter(prefix="/api/me", tags=["me"])


def _to_me_response(user: User) -> MeResponse:
    practice = None
    if user.practice_profile is not None:
        practice = PracticeProfileSchema.model_validate(user.practice_profile)

    return MeResponse(
        id=user.id,
        display_name=user.display_name,
        practising_since=user.practising_since,
        location=user.location,
        bio=user.bio,
        created_at=user.created_at,
        practice=practice,
    )


@router.get("", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return _to_me_response(current_user)


@router.patch("", response_model=MeResponse)
def update_me(
    data: MeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.practising_since is not None:
        current_user.practising_since = data.practising_since
    if data.location is not None:
        current_user.location = data.location
    if data.bio is not None:
        current_user.bio = data.bio

    db.commit()
    db.refresh(current_user)

    return _to_me_response(current_user)


@router.put("/practice", response_model=PracticeProfileSchema)
def put_practice(
    data: PracticeProfileSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intent = db.get(Intent, data.intent_id)
    if intent is None:
        raise HTTPException(status_code=422, detail="Intent does not exist.")

    element = db.get(MeditationElement, data.element_id)
    if element is None:
        raise HTTPException(
            status_code=422, detail="Meditation element does not exist."
        )

    if data.environment.value == "dissolve" and element.slug != "fire":
        raise HTTPException(
            status_code=422,
            detail="environment=dissolve is only valid for the fire element.",
        )

    profile = current_user.practice_profile
    if profile is None:
        profile = PracticeProfile(user_id=current_user.id)
        db.add(profile)

    profile.mode = data.mode
    profile.intent_id = data.intent_id
    profile.element_id = data.element_id
    profile.environment = data.environment
    profile.duration_seconds = data.duration_seconds
    profile.sound = data.sound
    profile.timer_visible = data.timer_visible

    db.commit()
    db.refresh(profile)

    return PracticeProfileSchema.model_validate(profile)


@router.get("/stats", response_model=PracticeStats)
def get_stats(
    tz: str = Query(default="UTC"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return compute_stats(db, current_user.id, tz)
