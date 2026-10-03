from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings


def test_admin_catalog_permissions(client, account, catalog_headers):
    headers = account()["headers"]
    assert client.post("/api/v1/skills", json={"name": "Python"}).status_code == 401
    assert (
        client.post("/api/v1/skills", headers=headers, json={"name": "Python"}).status_code == 403
    )
    skill = client.post("/api/v1/skills", headers=catalog_headers, json={"name": "Python"}).json()
    path = f"/api/v1/skills/{skill['id']}"
    assert client.patch(path, headers=headers, json={"name": "Stolen"}).status_code == 403
    assert client.delete(path, headers=headers).status_code == 403
    assert client.get(path).status_code == 200
    assert client.patch(path, headers=catalog_headers, json={"name": "Python 3"}).status_code == 200
    assert client.delete(path, headers=catalog_headers).status_code == 204


def test_jwt_claims_and_revocation(client, account):
    user = account()
    for claims in [
        {"sub": str(user["user"]["id"])},
        {"sub": "bad", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        {"sub": str(user["user"]["id"]), "exp": datetime.now(timezone.utc) - timedelta(minutes=5)},
    ]:
        token = jwt.encode(claims, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        assert (
            client.get("/api/v1/users/me", headers={"Authorization": "Bearer " + token}).status_code
            == 401
        )
    assert (
        client.post(
            "/api/v1/auth/change-password",
            headers=user["headers"],
            json={
                "current_password": user["data"]["password"],
                "new_password": "ChangedPassword123!",
            },
        ).status_code
        == 200
    )
    assert client.get("/api/v1/users/me", headers=user["headers"]).status_code == 401
    login = client.post(
        "/api/v1/auth/login", json={**user["data"], "password": "ChangedPassword123!"}
    )
    assert login.status_code == 200
    assert (
        client.get(
            "/api/v1/users/me", headers={"Authorization": "Bearer " + login.json()["access_token"]}
        ).status_code
        == 200
    )


def test_admin_views_and_security_headers(client, account, catalog_headers):
    headers = account()["headers"]
    assert client.get("/api/v1/admin/users").status_code == 401
    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403
    users = client.get("/api/v1/admin/users", headers=catalog_headers)
    assert users.status_code == 200
    assert all("hashed_password" not in user for user in users.json())
    assert client.get("/api/v1/admin/metrics", headers=catalog_headers).status_code == 200
    assert users.headers["X-Content-Type-Options"] == "nosniff"
    assert users.headers["Cache-Control"] == "no-store"
    assert len(users.headers["X-Request-ID"]) == 32


def test_database_error_is_sanitized(client, account, monkeypatch):
    from sqlalchemy.exc import OperationalError

    from app.crud import goal

    headers = account()["headers"]

    def fail(*args, **kwargs):
        raise OperationalError(
            "private SQL", {"password": "private password"}, Exception("private details")
        )

    monkeypatch.setattr(goal, "get_user_goals", fail)
    response = client.get("/api/v1/users/me/goals", headers=headers)
    assert response.status_code == 503
    assert response.json() == {"detail": "Database temporarily unavailable"}


def test_production_configuration():
    import pytest
    from pydantic import ValidationError

    from app.core.config import Settings

    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql+psycopg://localhost/test",
            JWT_SECRET_KEY="short",
        )
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DATABASE_URL="postgresql+psycopg://localhost/test",
            JWT_SECRET_KEY="x" * 48,
            ALLOWED_HOSTS=["*"],
        )


def test_expiration_while_waiting_for_identity_lock(client, account, monkeypatch):
    from app.core import dependencies

    user = account()
    decode = dependencies.decode_access_claims
    calls = 0

    def expire_after_initial_validation(token):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise ValueError("Expired while waiting for lock")
        return decode(token)

    monkeypatch.setattr(dependencies, "decode_access_claims", expire_after_initial_validation)
    response = client.post(
        "/api/v1/auth/change-password",
        headers=user["headers"],
        json={"current_password": user["data"]["password"], "new_password": "ChangedPassword123!"},
    )
    assert response.status_code == 401
