from datetime import datetime, timezone
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config.config import settings
from app.db.db import get_db
from app.models.user import User
from app.models.visibility import Visibility

bearer_scheme = HTTPBearer()

@lru_cache
def get_jwks_client() -> PyJWKClient:
    """
    Lazy init
    """
    return PyJWKClient(settings.supabase_jwks_url)

# Get current user claims for *cryptographic authentication*
def get_current_user_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )

        return claims

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _display_name_from_claims(claims: dict) -> str:
    user_metadata = claims.get("user_metadata") or {}
    display_name = user_metadata.get("display_name")

    if not display_name:
        email = claims.get("email")
        if email and "@" in email:
            display_name = email.split("@", 1)[0]

    if not display_name:
        display_name = "Practitioner"

    return str(display_name)[:40]


# Get current user for *application identity*. Auto-provisions a User row
# on the first authenticated request for a given Supabase account.
def get_current_user(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db),
) -> User:

    provider_id = claims.get("sub")
    # Handle a missing sub
    if not provider_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(
        select(User).where(
            User.auth_provider_id == provider_id
        )
    )

    if user is not None:
        return user

    now = datetime.now(timezone.utc)
    new_user = User(
        auth_provider_id=provider_id,
        display_name=_display_name_from_claims(claims),
        practising_since=now.date(),
        created_at=now,
        visibility=Visibility.PUBLIC
    )
    db.add(new_user)

    try:
        db.commit()
    except IntegrityError:
        # Another concurrent request provisioned the same user first.
        db.rollback()
        user = db.scalar(
            select(User).where(User.auth_provider_id == provider_id)
        )
        if user is None:
            raise
        return user

    db.refresh(new_user)
    return new_user
