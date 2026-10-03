from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.models.base import Base


class LearningTopic(Base):
    __tablename__ = "learning_topics"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_learning_topic_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int | None] = mapped_column(
        ForeignKey("skills.id", ondelete="SET NULL"), index=True
    )
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(String(5000))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    resources = relationship(
        "LearningResource",
        cascade="all, delete-orphan",
        back_populates="topic",
        passive_deletes=True,
    )

    user = relationship("User", back_populates="topics")


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("learning_topics.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(2000))
    kind: Mapped[str] = mapped_column(String(20), default="article")
    description: Mapped[str | None] = mapped_column(String(5000))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    topic = relationship("LearningTopic", back_populates="resources")
