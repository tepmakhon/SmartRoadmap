from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.models.base import Base


class GoalSkill(Base):
    __tablename__ = "goal_skills"
    __table_args__ = (
        UniqueConstraint("goal_id", "skill_id", name="uq_goal_skill"),
        UniqueConstraint("goal_id", "position", name="uq_goal_skill_position"),
        CheckConstraint("position >= 0", name="ck_goal_skill_position"),
        CheckConstraint(
            "required_proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')",
            name="ck_goal_skill_proficiency",
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    required_proficiency: Mapped[str] = mapped_column(String(20))
    position: Mapped[int] = mapped_column(Integer)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str] = mapped_column(String(500))
    read_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user = relationship("User", back_populates="notifications")
