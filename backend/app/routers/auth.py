from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_current_user_for_update
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.core.time import utcnow
from app.crud.user import (
    create_refresh_token as save_refresh_token,
)
from app.crud.user import (
    create_user,
    get_refresh_token,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    get_user_refresh_tokens,
    revoke_all_user_refresh_tokens,
    revoke_user_refresh_token,
    update_user_password,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    LogoutRequest,
    RefreshTokenRequest,
    SessionResponse,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    existing_email = get_user_by_email(
        db,
        user_data.email,
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    existing_username = get_user_by_username(
        db,
        user_data.username,
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    user = create_user(
        db,
        user_data,
    )

    return user


@router.post(
    "/login",
    response_model=Token,
)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    user = get_user_by_email(
        db,
        user_data.email,
        lock=True,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(
        user_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Access token
    access_token = create_access_token(
        str(user.id), token_version=user.token_version
    )

    # Raw refresh token
    refresh_token = create_refresh_token()

    # Hash refresh token before storing it
    token_hash = hash_refresh_token(
        refresh_token
    )

    # Refresh token expiration
    expires_at = (
        utcnow()
        + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    # Store only the hash
    save_refresh_token(
        db=db,
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post(
    "/refresh",
    response_model=Token,
)
def refresh_access_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    # Hash the raw refresh token
    token_hash = hash_refresh_token(
        token_data.refresh_token
    )

    # Find the refresh token in database
    refresh_token = get_refresh_token(
        db,
        token_hash,
    )

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Find the user
    user = get_user_by_id(
        db,
        refresh_token.user_id,
        lock=True,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    refresh_token = get_refresh_token(db, token_hash, lock=True)
    if refresh_token is None:
        raise HTTPException(401, "Invalid refresh token")

    # Make sure the token has not already been revoked
    if refresh_token.revoked_at is not None:
        revoke_all_user_refresh_tokens(
            db,
            refresh_token.user_id,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected",
        )
    # Make sure the token has not expired
    if refresh_token.expires_at <= utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # --------------------------------------------------
    # ROTATE REFRESH TOKEN
    # --------------------------------------------------

    # 1. Revoke old refresh token
    refresh_token.revoked_at = utcnow()

    # 2. Create new access token
    access_token = create_access_token(
        str(user.id), token_version=user.token_version
    )

    # 3. Create new raw refresh token
    new_refresh_token = create_refresh_token()

    # 4. Hash new refresh token before storing
    new_token_hash = hash_refresh_token(
        new_refresh_token
    )

    # 5. Calculate new expiration
    expires_at = (
        utcnow()
        + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    # 6. Store new refresh token
    save_refresh_token(
        db=db,
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=expires_at,
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

@router.post("/logout")
def logout(
    token_data: LogoutRequest,
    db: Session = Depends(get_db),
):
    token_hash = hash_refresh_token(
        token_data.refresh_token
    )

    refresh_token = get_refresh_token(
        db,
        token_hash,
    )

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    get_user_by_id(db, refresh_token.user_id, lock=True)
    refresh_token = get_refresh_token(db, token_hash, lock=True)
    if refresh_token is None:
        raise HTTPException(401, "Invalid refresh token")

    if refresh_token.revoked_at is not None:
        return {
            "message": "Already logged out"
        }

    refresh_token.revoked_at = utcnow()

    db.commit()

    return {
        "message": "Successfully logged out"
    }

@router.get(
    "/sessions",
    response_model=list[SessionResponse],
)
def get_sessions(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tokens = get_user_refresh_tokens(
        db,
        current_user.id,
        offset,
        limit,
    )

    now = utcnow()

    return [
        SessionResponse(
            id=token.id,
            created_at=token.created_at,
            expires_at=token.expires_at,
            revoked_at=token.revoked_at,
            is_active=(
                token.revoked_at is None
                and token.expires_at > now
            ),
        )
        for token in tokens
    ]

@router.delete(
    "/sessions/{session_id}",
)
def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    token = revoke_user_refresh_token(
        db,
        current_user.id,
        session_id,
    )

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return {
        "message": "Session revoked successfully"
    }

@router.post(
    "/sessions/revoke-all",
)
def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    revoked_count = revoke_all_user_refresh_tokens(
        db,
        current_user.id,
    )

    return {
        "message": "All sessions revoked successfully",
        "revoked_count": revoked_count,
    }

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user_for_update),
    db: Session = Depends(get_db),
):
    if not verify_password(
        password_data.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    hashed_password = hash_password(
        password_data.new_password
    )

    update_user_password(
        db,
        current_user,
        hashed_password,
    )

    return {
        "message": "Password changed successfully"
    }