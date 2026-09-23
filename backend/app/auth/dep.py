from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.db import get_db
from app.config.config import settings
from app.models.user import User

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

# Get current user for *application identity*
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
    # Handle user not found
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User account not found",
        )

    return user