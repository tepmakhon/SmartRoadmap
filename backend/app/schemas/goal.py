from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.goal import GoalPriority, GoalStatus


class GoalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    target_role: str | None = Field(default=None, max_length=150)
    target_date: date | None = None
    status: GoalStatus = GoalStatus.active
    priority: GoalPriority = GoalPriority.medium


class GoalUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    target_role: str | None = Field(default=None, max_length=150)
    target_date: date | None = None
    status: GoalStatus | None = None
    priority: GoalPriority | None = None

    @field_validator("title", "status", "priority")
    @classmethod
    def reject_null(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return value


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    target_role: str | None
    target_date: date | None
    status: GoalStatus
    priority: GoalPriority
    created_at: datetime
    updated_at: datetime
