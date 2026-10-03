from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud import goal as crud
from app.db.database import get_db
from app.models.goal import GoalPriority, GoalStatus
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/api/v1/users/me/goals", tags=["Goals"])


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_my_goal(
    data: GoalCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return crud.create_goal(db, user.id, data)


@router.get("", response_model=list[GoalResponse])
def list_my_goals(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: GoalStatus | None = None,
    priority: GoalPriority | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_user_goals(db, user.id, offset, limit, status, priority)


@router.get("/{goal_id}", response_model=GoalResponse)
def get_my_goal(
    goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    goal = crud.get_user_goal(db, user.id, goal_id)
    if goal is None:
        raise HTTPException(404, "Goal not found")
    return goal


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_my_goal(
    goal_id: int,
    data: GoalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = crud.update_goal(db, user.id, goal_id, data)
    if goal is None:
        raise HTTPException(404, "Goal not found")
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_goal(
    goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if not crud.delete_goal(db, user.id, goal_id):
        raise HTTPException(404, "Goal not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
