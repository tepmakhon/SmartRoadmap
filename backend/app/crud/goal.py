from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.goal import Goal, GoalPriority, GoalStatus
from app.schemas.goal import GoalCreate, GoalUpdate


def create_goal(db: Session, user_id: int, data: GoalCreate) -> Goal:
    goal = Goal(user_id=user_id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def get_user_goals(
    db: Session,
    user_id: int,
    offset: int = 0,
    limit: int = 50,
    status: GoalStatus | None = None,
    priority: GoalPriority | None = None,
) -> list[Goal]:
    statement = select(Goal).where(Goal.user_id == user_id)
    if status is not None:
        statement = statement.where(Goal.status == status)
    if priority is not None:
        statement = statement.where(Goal.priority == priority)
    statement = (
        statement.order_by(Goal.created_at.desc(), Goal.id.desc()).offset(offset).limit(limit)
    )
    return list(db.scalars(statement).all())


def get_user_goal(db: Session, user_id: int, goal_id: int) -> Goal | None:
    return db.scalar(select(Goal).where(Goal.user_id == user_id, Goal.id == goal_id))


def update_goal(db: Session, user_id: int, goal_id: int, data: GoalUpdate) -> Goal | None:
    goal = get_user_goal(db, user_id, goal_id)
    if goal is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, user_id: int, goal_id: int) -> bool:
    goal = get_user_goal(db, user_id, goal_id)
    if goal is None:
        return False
    db.delete(goal)
    db.commit()
    return True
