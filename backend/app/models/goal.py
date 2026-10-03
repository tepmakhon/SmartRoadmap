from datetime import date, datetime
from enum import Enum

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.models.base import Base


class GoalStatus(str, Enum):
    active = "active"
    completed = "completed"
    paused = "paused"
    cancelled = "cancelled"


class GoalPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Goal(Base):
    __tablename__ = "goals"
    __table_args__ = (CheckConstraint("length(trim(title)) > 0", name="ck_goals_title_nonempty"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(String(5000))
    target_role: Mapped[str | None] = mapped_column(String(150))
    target_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[GoalStatus] = mapped_column(
        SAEnum(GoalStatus, name="goal_status"), default=GoalStatus.active
    )
    priority: Mapped[GoalPriority] = mapped_column(
        SAEnum(GoalPriority, name="goal_priority"), default=GoalPriority.medium
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="goals")
