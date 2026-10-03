import os
import secrets
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite://")
os.environ["JWT_SECRET_KEY"] = secrets.token_urlsafe(48)

from app.db.database import get_db
from app.main import app
from app.models.base import Base


@pytest.fixture
def db():
    url = os.environ["DATABASE_URL"]
    if url.startswith("sqlite"):
        engine = create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)

        @event.listens_for(engine, "connect")
        def foreign_keys(connection, record):
            connection.execute("PRAGMA foreign_keys=ON")

        Base.metadata.create_all(engine)
        with Session(engine) as session:
            yield session
    else:
        # An isolated schema and outer transaction protect existing application data.
        engine = create_engine(url)
        with engine.connect() as connection:
            transaction = connection.begin()
            schema = "test_" + uuid4().hex
            connection.execute(text(f'CREATE SCHEMA "{schema}"'))
            connection.execute(text(f'SET LOCAL search_path TO "{schema}"'))
            Base.metadata.create_all(connection)
            with Session(bind=connection, join_transaction_mode="create_savepoint") as session:
                yield session
            transaction.rollback()
    engine.dispose()


@pytest.fixture
def client(db):
    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def account(client):
    def create(username="alice"):
        data = {
            "email": f"{username}@example.com",
            "username": username,
            "password": "SecurePassword123!",
        }
        response = client.post("/api/v1/auth/register", json=data)
        assert response.status_code == 201, response.text
        tokens = client.post("/api/v1/auth/login", json=data).json()
        return {
            "user": response.json(),
            "tokens": tokens,
            "headers": {"Authorization": "Bearer " + tokens["access_token"]},
            "data": data,
        }

    return create


@pytest.fixture
def catalog_headers(account, db):
    from app.models.user import User

    admin = account("catalog_admin")
    user = db.get(User, admin["user"]["id"])
    user.is_admin = True
    db.commit()
    return admin["headers"]
