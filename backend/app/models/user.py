from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time import utcnow
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"), nullable=False)

    token_version: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    profile = relationship(
    "UserProfile",
    back_populates="user",
    uselist=False,
    cascade="all, delete-orphan",
    )

    user_skills = relationship(
        "UserSkill",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    goals = relationship(
        "Goal", back_populates="user", cascade="all, delete-orphan",
        passive_deletes=True,
    )


    topics = relationship("LearningTopic", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

    assessments = relationship("SkillAssessment", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)

    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
