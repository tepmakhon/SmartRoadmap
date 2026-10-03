from sqlalchemy import select

from app.core.time import utcnow
from app.crud.goal import get_user_goal
from app.crud.learning import save
from app.models.goal import Goal
from app.models.recommendation import GoalSkill, Notification


def create_requirement(db, user_id, goal_id, data):
    if get_user_goal(db, user_id, goal_id) is None:
        return None
    return save(db, GoalSkill(goal_id=goal_id, **data))


def list_requirements(db, user_id, goal_id, offset, limit):
    return list(
        db.scalars(
            select(GoalSkill)
            .join(Goal)
            .where(Goal.user_id == user_id, Goal.id == goal_id)
            .order_by(GoalSkill.position)
            .offset(offset)
            .limit(limit)
        ).all()
    )


def get_requirement(db, user_id, goal_id, skill_id):
    return db.scalar(
        select(GoalSkill)
        .join(Goal)
        .where(Goal.user_id == user_id, Goal.id == goal_id, GoalSkill.skill_id == skill_id)
    )


def list_notifications(db, user_id, offset, limit, unread):
    statement = select(Notification).where(Notification.user_id == user_id)
    if unread:
        statement = statement.where(Notification.read_at.is_(None))
    return list(
        db.scalars(statement.order_by(Notification.id.desc()).offset(offset).limit(limit)).all()
    )


def read_notification(db, user_id, notification_id):
    record = db.scalar(
        select(Notification).where(
            Notification.user_id == user_id, Notification.id == notification_id
        )
    )
    if record is None:
        return None
    record.read_at = record.read_at or utcnow()
    return save(db, record)
