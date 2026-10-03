from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.api import required, write
from app.core.dependencies import get_current_user
from app.crud import recommendation as crud
from app.crud.goal import get_user_goal
from app.crud.learning import delete_record
from app.crud.skill import get_skill_by_id
from app.db.database import get_db
from app.models.user import User
from app.schemas.recommendation import (
    AnalyticsResponse,
    GoalSkillCreate,
    GoalSkillResponse,
    NotificationResponse,
    RecommendationResponse,
)
from app.schemas.roadmap import RoadmapResponse
from app.services.recommendation import analytics, generate_roadmap, recommendations

router = APIRouter(prefix="/api/v1/users/me", tags=["Recommendations"])


@router.post("/goals/{goal_id}/skills", response_model=GoalSkillResponse, status_code=201)
def add_requirement(
    goal_id: int,
    data: GoalSkillCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(get_user_goal(db, user.id, goal_id))
    if get_skill_by_id(db, data.skill_id) is None:
        raise HTTPException(404, "Skill not found")
    return write(crud.create_requirement, db, user.id, goal_id, data.model_dump())


@router.get("/goals/{goal_id}/skills", response_model=list[GoalSkillResponse])
def list_requirements(
    goal_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(get_user_goal(db, user.id, goal_id))
    return crud.list_requirements(db, user.id, goal_id, offset, limit)


@router.delete("/goals/{goal_id}/skills/{skill_id}", status_code=204)
def delete_requirement(
    goal_id: int,
    skill_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_record(db, required(crud.get_requirement(db, user.id, goal_id, skill_id)))
    return Response(status_code=204)


@router.get("/goals/{goal_id}/recommendations", response_model=list[RecommendationResponse])
def get_recommendations(
    goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return required(recommendations(db, user.id, goal_id))


@router.post("/goals/{goal_id}/generate-roadmap", response_model=RoadmapResponse, status_code=201)
def generate(goal_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return write(generate_roadmap, db, user.id, goal_id)


@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_notifications(db, user.id, offset, limit, unread)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return required(crud.read_notification(db, user.id, notification_id))


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return analytics(db, user.id)
