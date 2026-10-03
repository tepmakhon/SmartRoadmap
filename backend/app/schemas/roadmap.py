from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.goal import GoalStatus
from app.models.roadmap import TaskStatus


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("title", "status", "position", check_fields=False)
    @classmethod
    def non_null(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return value


class RoadmapCreate(Input):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    goal_id: int | None = Field(default=None, gt=0)
    status: GoalStatus = GoalStatus.active


class RoadmapUpdate(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    goal_id: int | None = Field(default=None, gt=0)
    status: GoalStatus | None = None


class RoadmapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    goal_id: int | None
    title: str
    description: str | None
    status: GoalStatus
    created_at: datetime
    updated_at: datetime


class MilestoneCreate(Input):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    position: int = Field(ge=0)
    target_date: date | None = None


class MilestoneUpdate(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    position: int | None = Field(default=None, ge=0)
    target_date: date | None = None


class MilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    roadmap_id: int
    title: str
    description: str | None
    position: int
    target_date: date | None
    created_at: datetime


class TaskCreate(MilestoneCreate):
    topic_id: int | None = Field(default=None, gt=0)
    resource_id: int | None = Field(default=None, gt=0)
    status: TaskStatus = TaskStatus.pending


class TaskUpdate(MilestoneUpdate):
    topic_id: int | None = Field(default=None, gt=0)
    resource_id: int | None = Field(default=None, gt=0)
    status: TaskStatus | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    position: int
    target_date: date | None
    created_at: datetime
    milestone_id: int
    topic_id: int | None
    resource_id: int | None
    status: TaskStatus
    completed_at: datetime | None
    updated_at: datetime


class ProgressResponse(BaseModel):
    roadmap_id: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    percent_complete: float
