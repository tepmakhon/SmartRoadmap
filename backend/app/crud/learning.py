from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.learning import LearningResource, LearningTopic


def save(db: Session, record):
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except IntegrityError:
        db.rollback()
        raise


def get_topic(db: Session, user_id: int, topic_id: int) -> LearningTopic | None:
    return db.scalar(
        select(LearningTopic).where(LearningTopic.id == topic_id, LearningTopic.user_id == user_id)
    )


def list_topics(db: Session, user_id: int, offset: int, limit: int, search: str | None):
    statement = select(LearningTopic).where(LearningTopic.user_id == user_id)
    if search:
        statement = statement.where(LearningTopic.name.contains(search, autoescape=True))
    return list(
        db.scalars(
            statement.order_by(LearningTopic.name, LearningTopic.id).offset(offset).limit(limit)
        ).all()
    )


def create_topic(db: Session, user_id: int, data: dict):
    return save(db, LearningTopic(user_id=user_id, **data))


def update_topic(db: Session, user_id: int, topic_id: int, data: dict):
    topic = get_topic(db, user_id, topic_id)
    if topic is None:
        return None
    for field, value in data.items():
        setattr(topic, field, value)
    return save(db, topic)


def get_resource(db: Session, user_id: int, topic_id: int, resource_id: int):
    return db.scalar(
        select(LearningResource)
        .join(LearningTopic)
        .where(
            LearningTopic.user_id == user_id,
            LearningTopic.id == topic_id,
            LearningResource.id == resource_id,
        )
    )


def list_resources(db: Session, user_id: int, topic_id: int, offset: int, limit: int):
    return list(
        db.scalars(
            select(LearningResource)
            .join(LearningTopic)
            .where(LearningTopic.user_id == user_id, LearningTopic.id == topic_id)
            .order_by(LearningResource.id)
            .offset(offset)
            .limit(limit)
        ).all()
    )


def create_resource(db: Session, user_id: int, topic_id: int, data: dict):
    if get_topic(db, user_id, topic_id) is None:
        return None
    return save(db, LearningResource(topic_id=topic_id, **data))


def update_resource(db: Session, user_id: int, topic_id: int, resource_id: int, data: dict):
    resource = get_resource(db, user_id, topic_id, resource_id)
    if resource is None:
        return None
    for field, value in data.items():
        setattr(resource, field, value)
    return save(db, resource)


def delete_record(db: Session, record) -> bool:
    if record is None:
        return False
    db.delete(record)
    db.commit()
    return True
