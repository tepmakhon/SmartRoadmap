from datetime import datetime, timezone


def utcnow() -> datetime:
    """UTC without tzinfo, matching the existing PostgreSQL timestamp columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
