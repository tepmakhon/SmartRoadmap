import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.observability import database_error, request_logging, unexpected_error
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.database import router as database_router
from app.routers.goals import router as goals_router
from app.routers.health import router as health_router
from app.routers.learning import router as learning_router
from app.routers.projects import router as projects_router
from app.routers.recommendations import router as recommendations_router
from app.routers.roadmaps import router as roadmaps_router
from app.routers.skills import router as skills_router
from app.routers.users import router as users_router

app = FastAPI(
    title="Smart Roadmap API",
    description="Backend API for Smart Roadmap",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)


logging.basicConfig(level=settings.LOG_LEVEL)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"], expose_headers=["X-Request-ID"])
app.middleware("http")(request_logging)
app.add_exception_handler(SQLAlchemyError, database_error)
app.add_exception_handler(Exception, unexpected_error)
app.include_router(admin_router)
app.include_router(health_router)
app.include_router(database_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(skills_router)
app.include_router(goals_router)
app.include_router(learning_router)
app.include_router(roadmaps_router)
app.include_router(projects_router)
app.include_router(recommendations_router)

@app.get("/")
def root():
    return {
        "message": "Smart Roadmap API is running"
    }