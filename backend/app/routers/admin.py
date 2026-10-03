from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_admin_user
from app.core.observability import request_counts
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(
    prefix="/api/v1/admin", tags=["Administration"], dependencies=[Depends(get_admin_user)]
)


@router.get("/users", response_model=list[UserResponse])
def list_users(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(User).order_by(User.id).offset(offset).limit(limit)).all())


@router.get("/metrics")
def metrics():
    """Request counters for this worker. Export centrally for multi-worker deployments."""
    return [
        {"method": method, "route": route, "status": status, "requests": count}
        for (method, route, status), count in request_counts.copy().items()
    ]
