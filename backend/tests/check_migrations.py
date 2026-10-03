"""Verify migration upgrades and downgrades without changing application tables."""

import sys
from pathlib import Path
from uuid import uuid4

from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from alembic import command

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, hide_parameters=True)
with engine.connect() as connection:
    transaction = connection.begin()
    try:
        schema = "migration_test_" + uuid4().hex
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
        connection.execute(text(f'SET LOCAL search_path TO "{schema}"'))
        config = Config("alembic.ini")
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
        command.check(config)
        assert inspect(connection).get_columns("goals")[6]["type"].enums == [
            "active",
            "completed",
            "paused",
            "cancelled",
        ]
        command.downgrade(config, "base")
        assert set(inspect(connection).get_table_names()) == {"alembic_version"}
        enums = connection.execute(
            text(
                "SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = :schema AND t.typtype = 'e'"
            ),
            {"schema": schema},
        ).all()
        assert enums == [], enums
        command.upgrade(config, "head")
        command.check(config)
        print("Migration round trip and metadata checks passed in a disposable PostgreSQL schema")
    finally:
        transaction.rollback()
engine.dispose()
