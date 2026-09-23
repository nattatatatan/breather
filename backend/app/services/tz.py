from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import HTTPException


def resolve_zone(tz: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown timezone: {tz}",
        ) from exc
