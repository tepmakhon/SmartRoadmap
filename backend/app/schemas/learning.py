from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ResourceKind(str, Enum):
    article = "article"
    video = "video"
    course = "course"
    book = "book"
    documentation = "documentation"


class TopicCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=5000)
    skill_id: int | None = Field(default=None, gt=0)


class TopicUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=5000)
    skill_id: int | None = Field(default=None, gt=0)

    @field_validator("name")
    @classmethod
    def non_null(cls, value):
        if value is None:
            raise ValueError("Name cannot be null")
        return value


class TopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None
    skill_id: int | None
    created_at: datetime
    updated_at: datetime


class ResourceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl = Field(max_length=2000)
    kind: ResourceKind = ResourceKind.article
    description: str | None = Field(default=None, max_length=5000)


class ResourceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    url: HttpUrl | None = Field(default=None, max_length=2000)
    kind: ResourceKind | None = None
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("title", "url", "kind")
    @classmethod
    def non_null(cls, value):
        if value is None:
            raise ValueError("This field cannot be null")
        return value


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    topic_id: int
    title: str
    url: str
    kind: ResourceKind
    description: str | None
    created_at: datetime
