from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.roadmap import Input
from app.schemas.user import ProficiencyLevel


class GoalSkillCreate(Input):
    skill_id: int = Field(gt=0)
    required_proficiency: ProficiencyLevel = ProficiencyLevel.intermediate
    position: int = Field(ge=0)


class GoalSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    skill_id: int
    required_proficiency: ProficiencyLevel
    position: int


class RecommendationResponse(BaseModel):
    skill_id: int
    skill_name: str
    current_proficiency: ProficiencyLevel | None
    required_proficiency: ProficiencyLevel
    gap: int
    position: int
    completed_projects: int
    latest_assessment_score: int | None
    topic_ids: list[int]
    resource_ids: list[int]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    message: str
    read_at: datetime | None
    created_at: datetime


class AnalyticsResponse(BaseModel):
    goals: int
    roadmaps: int
    total_tasks: int
    completed_tasks: int
    projects: int
    completed_projects: int
    assessments: int
