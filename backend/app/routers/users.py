from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_user_for_update
from app.core.security import verify_password
from app.crud.user import (
    create_user_profile,
    deactivate_user,
    get_user_by_email,
    get_user_by_username,
    get_user_profile,
    update_user_email,
    update_user_profile,
    update_user_username,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    ChangeEmailRequest,
    ChangeUsernameRequest,
    UserProfileResponse,
    UserProfileUpdate,
    UserResponse,
)

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.delete("/me")
def deactivate_account(
    current_user: User = Depends(get_current_user_for_update),
    db: Session = Depends(get_db),
):
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already deactivated",
        )

    deactivate_user(
        db,
        current_user,
    )


    return {
        "message": "Account deactivated successfully"
    }


@router.post("/me/change-email")
def change_email(
    email_data: ChangeEmailRequest,
    current_user: User = Depends(get_current_user_for_update),
    db: Session = Depends(get_db),
):
    if email_data.new_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email must be different from current email",
        )

    if not verify_password(
        email_data.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    existing_user = get_user_by_email(
        db,
        email_data.new_email,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    update_user_email(
        db,
        current_user,
        email_data.new_email,
    )


    return {
        "message": "Email changed successfully"
    }

@router.post("/me/change-username")
def change_username(
    username_data: ChangeUsernameRequest,
    current_user: User = Depends(get_current_user_for_update),
    db: Session = Depends(get_db),
):
    # Make sure the new username is different
    if username_data.new_username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New username must be different from current username",
        )

    # Verify current password
    if not verify_password(
        username_data.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Check username uniqueness
    existing_user = get_user_by_username(
        db,
        username_data.new_username,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    # Update username
    update_user_username(
        db,
        current_user,
        username_data.new_username,
    )


    return {
        "message": "Username changed successfully"
    }

@router.get(
    "/me/profile",
    response_model=UserProfileResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_user_profile(
        db,
        current_user.id,
    )

    if not profile:
        profile = create_user_profile(
            db,
            current_user.id,
            {},
        )

    return profile

@router.put(
    "/me/profile",
    response_model=UserProfileResponse,
)
def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_user_profile(
        db,
        current_user.id,
    )

    update_data = profile_data.model_dump(
        exclude_unset=True,
    )

    if not profile:
        profile = create_user_profile(
            db,
            current_user.id,
            update_data,
        )
    else:
        profile = update_user_profile(
            db,
            profile,
            update_data,
        )

    return profile