from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud import learning as crud
from app.crud.skill import get_skill_by_id
from app.db.database import get_db
from app.models.user import User
from app.schemas.learning import (
    ResourceCreate,
    ResourceResponse,
    ResourceUpdate,
    TopicCreate,
    TopicResponse,
    TopicUpdate,
)

router = APIRouter(prefix="/api/v1/users/me/topics", tags=["Learning"])


def required(record):
    if record is None:
        raise HTTPException(404, "Learning item not found")
    return record


def validate_skill(db, skill_id):
    if skill_id is not None and get_skill_by_id(db, skill_id) is None:
        raise HTTPException(404, "Skill not found")


@router.post("", response_model=TopicResponse, status_code=201)
def create_topic(
    data: TopicCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    validate_skill(db, data.skill_id)
    try:
        return crud.create_topic(db, user.id, data.model_dump())
    except IntegrityError:
        raise HTTPException(
            409, "Topic already exists or referenced skill is unavailable"
        ) from None


@router.get("", response_model=list[TopicResponse])
def list_topics(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None, max_length=150),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_topics(db, user.id, offset, limit, search)


@router.get("/{topic_id}", response_model=TopicResponse)
def get_topic(topic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return required(crud.get_topic(db, user.id, topic_id))


@router.patch("/{topic_id}", response_model=TopicResponse)
def update_topic(
    topic_id: int,
    data: TopicUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(crud.get_topic(db, user.id, topic_id))
    validate_skill(db, data.skill_id)
    try:
        return required(
            crud.update_topic(db, user.id, topic_id, data.model_dump(exclude_unset=True))
        )
    except IntegrityError:
        raise HTTPException(
            409, "Topic already exists or referenced skill is unavailable"
        ) from None


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    crud.delete_record(db, required(crud.get_topic(db, user.id, topic_id)))
    return Response(status_code=204)


@router.post("/{topic_id}/resources", response_model=ResourceResponse, status_code=201)
def create_resource(
    topic_id: int,
    data: ResourceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return required(crud.create_resource(db, user.id, topic_id, data.model_dump(mode="json")))


@router.get("/{topic_id}/resources", response_model=list[ResourceResponse])
def list_resources(
    topic_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(crud.get_topic(db, user.id, topic_id))
    return crud.list_resources(db, user.id, topic_id, offset, limit)


@router.get("/{topic_id}/resources/{resource_id}", response_model=ResourceResponse)
def get_resource(
    topic_id: int,
    resource_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return required(crud.get_resource(db, user.id, topic_id, resource_id))


@router.patch("/{topic_id}/resources/{resource_id}", response_model=ResourceResponse)
def update_resource(
    topic_id: int,
    resource_id: int,
    data: ResourceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return required(
        crud.update_resource(
            db, user.id, topic_id, resource_id, data.model_dump(mode="json", exclude_unset=True)
        )
    )


@router.delete("/{topic_id}/resources/{resource_id}", status_code=204)
def delete_resource(
    topic_id: int,
    resource_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crud.delete_record(db, required(crud.get_resource(db, user.id, topic_id, resource_id)))
    return Response(status_code=204)
