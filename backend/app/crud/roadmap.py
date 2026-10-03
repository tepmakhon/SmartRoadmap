from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.time import utcnow
from app.crud.goal import get_user_goal
from app.crud.learning import get_topic, save
from app.models.learning import LearningResource, LearningTopic
from app.models.roadmap import LearningTask, Milestone, Roadmap, TaskStatus


class ReferenceNotFound(ValueError):
    pass


def get_roadmap(db: Session, user_id: int, roadmap_id: int):
    return db.scalar(select(Roadmap).where(Roadmap.id == roadmap_id, Roadmap.user_id == user_id))


def list_roadmaps(db: Session, user_id: int, offset: int, limit: int):
    return list(
        db.scalars(
            select(Roadmap)
            .where(Roadmap.user_id == user_id)
            .order_by(Roadmap.created_at.desc(), Roadmap.id.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )


def validate_goal(db, user_id, data):
    if data.get("goal_id") is not None and get_user_goal(db, user_id, data["goal_id"]) is None:
        raise ReferenceNotFound("Goal not found")


def create_roadmap(db, user_id, data):
    validate_goal(db, user_id, data)
    return save(db, Roadmap(user_id=user_id, **data))


def update_roadmap(db, user_id, roadmap_id, data):
    record = get_roadmap(db, user_id, roadmap_id)
    if record is None:
        return None
    validate_goal(db, user_id, data)
    return update(db, record, data)


def update(db, record, data):
    for field, value in data.items():
        setattr(record, field, value)
    return save(db, record)


def get_milestone(db, user_id, roadmap_id, milestone_id):
    return db.scalar(
        select(Milestone)
        .join(Roadmap)
        .where(Roadmap.user_id == user_id, Roadmap.id == roadmap_id, Milestone.id == milestone_id)
    )


def list_milestones(db, user_id, roadmap_id, offset, limit):
    return list(
        db.scalars(
            select(Milestone)
            .join(Roadmap)
            .where(Roadmap.user_id == user_id, Roadmap.id == roadmap_id)
            .order_by(Milestone.position, Milestone.id)
            .offset(offset)
            .limit(limit)
        ).all()
    )


def create_milestone(db, user_id, roadmap_id, data):
    if get_roadmap(db, user_id, roadmap_id) is None:
        return None
    return save(db, Milestone(roadmap_id=roadmap_id, **data))


def get_task(db, user_id, roadmap_id, milestone_id, task_id):
    return db.scalar(
        select(LearningTask)
        .join(Milestone)
        .join(Roadmap)
        .where(
            Roadmap.user_id == user_id,
            Roadmap.id == roadmap_id,
            Milestone.id == milestone_id,
            LearningTask.id == task_id,
        )
    )


def list_tasks(db, user_id, roadmap_id, milestone_id, offset, limit):
    return list(
        db.scalars(
            select(LearningTask)
            .join(Milestone)
            .join(Roadmap)
            .where(
                Roadmap.user_id == user_id, Roadmap.id == roadmap_id, Milestone.id == milestone_id
            )
            .order_by(LearningTask.position, LearningTask.id)
            .offset(offset)
            .limit(limit)
        ).all()
    )


def validate_learning(db, user_id, data, record=None):
    topic_id = data.get("topic_id", getattr(record, "topic_id", None))
    resource_id = data.get("resource_id", getattr(record, "resource_id", None))
    if topic_id is not None and get_topic(db, user_id, topic_id) is None:
        raise ReferenceNotFound("Topic not found")
    if resource_id is not None:
        resource = db.scalar(
            select(LearningResource)
            .join(LearningTopic)
            .where(LearningResource.id == resource_id, LearningTopic.user_id == user_id)
        )
        if resource is None:
            raise ReferenceNotFound("Resource not found")
        if topic_id is not None and resource.topic_id != topic_id:
            raise ValueError("Resource must belong to the selected topic")


def create_task(db, user_id, roadmap_id, milestone_id, data):
    if get_milestone(db, user_id, roadmap_id, milestone_id) is None:
        return None
    validate_learning(db, user_id, data)
    if data.get("status") == TaskStatus.completed:
        data["completed_at"] = utcnow()
    return save(db, LearningTask(milestone_id=milestone_id, **data))


def update_task(db, user_id, roadmap_id, milestone_id, task_id, data):
    record = get_task(db, user_id, roadmap_id, milestone_id, task_id)
    if record is None:
        return None
    validate_learning(db, user_id, data, record)
    if "status" in data:
        data["completed_at"] = (
            (record.completed_at or utcnow()) if data["status"] == TaskStatus.completed else None
        )
    return update(db, record, data)


def progress(db, user_id, roadmap_id):
    if get_roadmap(db, user_id, roadmap_id) is None:
        return None
    counts = dict(
        db.execute(
            select(LearningTask.status, func.count(LearningTask.id))
            .join(Milestone)
            .join(Roadmap)
            .where(Roadmap.user_id == user_id, Roadmap.id == roadmap_id)
            .group_by(LearningTask.status)
        ).all()
    )
    total = sum(counts.values())
    completed = counts.get(TaskStatus.completed, 0)
    return {
        "roadmap_id": roadmap_id,
        "total_tasks": total,
        "completed_tasks": completed,
        "in_progress_tasks": counts.get(TaskStatus.in_progress, 0),
        "percent_complete": round(100 * completed / total, 2) if total else 0.0,
    }
