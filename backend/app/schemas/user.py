from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from enum import Enum

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(
        min_length=3,
        max_length=50,
    )
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    full_name: str | None = Field(
        default=None,
        max_length=100,
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    full_name: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str


class LogoutRequest(BaseModel):
    refresh_token: str


class SessionResponse(BaseModel):
    id: int
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    is_active: bool


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str

class ChangeUsernameRequest(BaseModel):
    current_password: str
    new_username: str = Field(
        min_length=3,
        max_length=50,
    )

class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        max_length=100,
    )

    bio: str | None = Field(
        default=None,
        max_length=2000,
    )

    avatar_url: str | None = Field(
        default=None,
        max_length=500,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    date_of_birth: date | None = None

    location: str | None = Field(
        default=None,
        max_length=150,
    )


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    phone: str | None
    date_of_birth: date | None
    location: str | None
    created_at: datetime
    updated_at: datetime


class ProficiencyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class SkillCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )
    category: str | None = Field(
        default=None,
        max_length=100,
    )
    description: str | None = Field(
        default=None,
        max_length=500,
    )


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str | None
    description: str | None
    created_at: datetime


class UserSkillCreate(BaseModel):
    skill_id: int
    proficiency: ProficiencyLevel = ProficiencyLevel.beginner


class UserSkillUpdate(BaseModel):
    proficiency: ProficiencyLevel

class UserSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    skill: SkillResponse
    proficiency: ProficiencyLevel
    created_at: datetime
    updated_at: datetime