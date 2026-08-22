from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    verify_password,
)
from app.crud.user import (
    create_refresh_token as save_refresh_token,
    create_user,
    get_refresh_token,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    revoke_refresh_token,
)
from app.db.database import get_db
from app.schemas.user import (
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    RefreshTokenRequest,
    LogoutRequest,
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
        str(user.id)
    )

    # Raw refresh token
    refresh_token = create_refresh_token()

    # Hash refresh token before storing it
    token_hash = hash_refresh_token(
        refresh_token
    )

    # Refresh token expiration
    expires_at = (
        datetime.utcnow()
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

    # Make sure the token has not already been revoked
    if refresh_token.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    # Make sure the token has not expired
    if refresh_token.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    # Find the user
    user = get_user_by_id(
        db,
        refresh_token.user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
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
    revoke_refresh_token(
        db,
        refresh_token,
    )

    # 2. Create new access token
    access_token = create_access_token(
        str(user.id)
    )

    # 3. Create new raw refresh token
    new_refresh_token = create_refresh_token()

    # 4. Hash new refresh token before storing
    new_token_hash = hash_refresh_token(
        new_refresh_token
    )

    # 5. Calculate new expiration
    expires_at = (
        datetime.utcnow()
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

    if refresh_token.revoked_at is not None:
        return {
            "message": "Already logged out"
        }

    refresh_token.revoked_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Successfully logged out"
    }