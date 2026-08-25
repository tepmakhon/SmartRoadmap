from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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