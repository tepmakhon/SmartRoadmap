from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, gt=0)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, gt=0)
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = []
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1", "testserver"]
    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def production_configuration(self):
        if self.JWT_ALGORITHM != "HS256":
            raise ValueError("JWT_ALGORITHM must be HS256")
        if self.ENVIRONMENT == "production":
            if len(self.JWT_SECRET_KEY) < 32:
                raise ValueError("Production JWT secret must contain at least 32 characters")
            if not self.DATABASE_URL.startswith("postgresql"):
                raise ValueError("Production requires PostgreSQL")
            if "*" in self.ALLOWED_HOSTS or "*" in self.CORS_ORIGINS:
                raise ValueError("Production requires explicit hosts and CORS origins")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
