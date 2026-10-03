from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.schemas.roadmap import Input
from app.schemas.user import SkillResponse


class ProjectCreate(Input):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    url: HttpUrl | None = Field(default=None, max_length=2000)


class ProjectUpdate(Input):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    url: HttpUrl | None = Field(default=None, max_length=2000)
    completed: bool | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
    url: str | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ProjectSkillCreate(Input):
    skill_id: int = Field(gt=0)


class ProjectSkillResponse(BaseModel):
    id: int
    skill: SkillResponse


class AssessmentCreate(Input):
    skill_id: int = Field(gt=0)
    score: int = Field(ge=0, le=100)
    notes: str | None = Field(default=None, max_length=5000)


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skill_id: int
    score: int
    notes: str | None
    created_at: datetime
