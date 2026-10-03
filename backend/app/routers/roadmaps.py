from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.api import required, write
from app.core.dependencies import get_current_user
from app.crud import roadmap as crud
from app.crud.learning import delete_record
from app.db.database import get_db
from app.models.user import User
from app.schemas.roadmap import (
    MilestoneCreate,
    MilestoneResponse,
    MilestoneUpdate,
    ProgressResponse,
    RoadmapCreate,
    RoadmapResponse,
    RoadmapUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/api/v1/users/me/roadmaps", tags=["Roadmaps"])


@router.post("", response_model=RoadmapResponse, status_code=201)
def create_roadmap(
    data: RoadmapCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return write(crud.create_roadmap, db, user.id, data.model_dump())


@router.get("", response_model=list[RoadmapResponse])
def list_roadmaps(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_roadmaps(db, user.id, offset, limit)


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(
    roadmap_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return required(crud.get_roadmap(db, user.id, roadmap_id))


@router.patch("/{roadmap_id}", response_model=RoadmapResponse)
def update_roadmap(
    roadmap_id: int,
    data: RoadmapUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return write(crud.update_roadmap, db, user.id, roadmap_id, data.model_dump(exclude_unset=True))


@router.delete("/{roadmap_id}", status_code=204)
def delete_roadmap(
    roadmap_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    delete_record(db, required(crud.get_roadmap(db, user.id, roadmap_id)))
    return Response(status_code=204)


@router.get("/{roadmap_id}/progress", response_model=ProgressResponse)
def get_progress(
    roadmap_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return required(crud.progress(db, user.id, roadmap_id))


@router.post("/{roadmap_id}/milestones", response_model=MilestoneResponse, status_code=201)
def create_milestone(
    roadmap_id: int,
    data: MilestoneCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return write(crud.create_milestone, db, user.id, roadmap_id, data.model_dump())


@router.get("/{roadmap_id}/milestones", response_model=list[MilestoneResponse])
def list_milestones(
    roadmap_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(crud.get_roadmap(db, user.id, roadmap_id))
    return crud.list_milestones(db, user.id, roadmap_id, offset, limit)


@router.get("/{roadmap_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def get_milestone(
    roadmap_id: int,
    milestone_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return required(crud.get_milestone(db, user.id, roadmap_id, milestone_id))


@router.patch("/{roadmap_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    roadmap_id: int,
    milestone_id: int,
    data: MilestoneUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = required(crud.get_milestone(db, user.id, roadmap_id, milestone_id))
    return write(crud.update, db, record, data.model_dump(exclude_unset=True))


@router.delete("/{roadmap_id}/milestones/{milestone_id}", status_code=204)
def delete_milestone(
    roadmap_id: int,
    milestone_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_record(db, required(crud.get_milestone(db, user.id, roadmap_id, milestone_id)))
    return Response(status_code=204)


@router.post(
    "/{roadmap_id}/milestones/{milestone_id}/tasks", response_model=TaskResponse, status_code=201
)
def create_task(
    roadmap_id: int,
    milestone_id: int,
    data: TaskCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return write(crud.create_task, db, user.id, roadmap_id, milestone_id, data.model_dump())


@router.get("/{roadmap_id}/milestones/{milestone_id}/tasks", response_model=list[TaskResponse])
def list_tasks(
    roadmap_id: int,
    milestone_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(crud.get_milestone(db, user.id, roadmap_id, milestone_id))
    return crud.list_tasks(db, user.id, roadmap_id, milestone_id, offset, limit)


@router.get("/{roadmap_id}/milestones/{milestone_id}/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    roadmap_id: int,
    milestone_id: int,
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return required(crud.get_task(db, user.id, roadmap_id, milestone_id, task_id))


@router.patch(
    "/{roadmap_id}/milestones/{milestone_id}/tasks/{task_id}", response_model=TaskResponse
)
def update_task(
    roadmap_id: int,
    milestone_id: int,
    task_id: int,
    data: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return write(
        crud.update_task,
        db,
        user.id,
        roadmap_id,
        milestone_id,
        task_id,
        data.model_dump(exclude_unset=True),
    )


@router.delete("/{roadmap_id}/milestones/{milestone_id}/tasks/{task_id}", status_code=204)
def delete_task(
    roadmap_id: int,
    milestone_id: int,
    task_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_record(db, required(crud.get_task(db, user.id, roadmap_id, milestone_id, task_id)))
    return Response(status_code=204)
