import logging
import time
from collections import Counter
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger("smart_roadmap")
request_counts = Counter()


async def request_logging(request: Request, call_next):
    request_id = uuid4().hex
    started = time.monotonic()
    request.state.request_id = request_id
    response = await call_next(request)
    route = request.scope.get("route")
    path = getattr(route, "path", "unmatched")
    request_counts[(request.method, path, response.status_code)] += 1
    logger.info(
        "request id=%s method=%s route=%s status=%s duration_ms=%.2f",
        request_id,
        request.method,
        path,
        response.status_code,
        1000 * (time.monotonic() - started),
    )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


async def database_error(request: Request, exc: SQLAlchemyError):
    logger.error(
        "database_failure id=%s type=%s",
        getattr(request.state, "request_id", "unknown"),
        type(exc).__name__,
    )
    if isinstance(exc, IntegrityError):
        return JSONResponse(
            status_code=409,
            content={"detail": "Data conflicts with an existing or referenced record"},
        )
    return JSONResponse(status_code=503, content={"detail": "Database temporarily unavailable"})


async def unexpected_error(request: Request, exc: Exception):
    logger.error(
        "request_failure id=%s type=%s",
        getattr(request.state, "request_id", "unknown"),
        type(exc).__name__,
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
