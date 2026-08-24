from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.user import (
    deactivate_user,
    revoke_all_user_refresh_tokens,
)
from app.db.database import get_db

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
    current_user: User = Depends(get_current_user),
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

    revoke_all_user_refresh_tokens(
        db,
        current_user.id,
    )

    return {
        "message": "Account deactivated successfully"
    }