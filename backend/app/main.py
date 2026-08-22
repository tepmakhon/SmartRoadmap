from fastapi import FastAPI

from app.routers.database import router as database_router
from app.routers.health import router as health_router
from app.routers.auth import router as auth_router


app = FastAPI(
    title="Smart Roadmap API",
    description="Backend API for Smart Roadmap",
    version="1.0.0",
)


app.include_router(health_router)
app.include_router(database_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Smart Roadmap API is running"
    }