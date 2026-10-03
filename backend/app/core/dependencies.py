from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_claims
from app.crud.user import get_user_by_id
from app.db.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    token = credentials.credentials

    try:
        claims = decode_access_claims(token)
        user_id = claims["user_id"]
    except ValueError:
        raise credentials_exception from None

    user = get_user_by_id(
        db,
        user_id,
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if user.token_version != claims["version"]:
        raise credentials_exception

    return user

def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user


def get_current_user_for_update(
    user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    locked_user = get_user_by_id(db, user.id, lock=True)
    try:
        claims = decode_access_claims(credentials.credentials)
    except ValueError:
        raise HTTPException(401, "Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}) from None
    if locked_user is None or locked_user.token_version != claims["version"]:
        raise HTTPException(401, "Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    if not locked_user.is_active:
        raise HTTPException(403, "User account is inactive")
    return locked_user
