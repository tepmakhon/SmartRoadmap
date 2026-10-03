# Smart Roadmap

FastAPI backend for personalized learning plans. This extends the existing Python 3.13, Pydantic 2, SQLAlchemy 2, PostgreSQL, and Alembic architecture.

## Implemented

- Registration, Argon2 passwords, JWT login, rotating refresh sessions, logout, session revocation, account changes, and deactivation.
- Automatically created profiles and nested user skill responses.
- Goals with status, priority, dates, validation, filtering, and pagination.
- Personal learning topics linked to skills, with HTTP/HTTPS learning resources.
- Roadmaps linked to goals, ordered milestones, learning tasks, and calculated progress.
- Projects, project-to-skill associations, and self-reported skill assessments.
- Goal skill requirements, skill-gap recommendations, and transactional roadmap generation.
- In-app roadmap notifications, read receipts, and personal analytics.
- Administrator permissions for shared skill catalog changes, administrator user listings, and worker request metrics.
- Configurable CORS/host validation, sanitized database errors, request identifiers, credential-safe logging, Docker Compose, and GitHub Actions checks.

All private endpoints scope reads and writes to the authenticated owner. Topics and resources are personal collections. Skills are a shared catalog: reads are public; writes require an administrator. Assessments are user-supplied scores, not independently verified examinations.

## Local setup

```sh
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
cp .env.example .env
```

For an existing installation, preserve `.env` and the database. Set `DATABASE_URL` to your existing PostgreSQL connection and `JWT_SECRET_KEY` to a securely generated value. Generate a secret with `python -c 'import secrets; print(secrets.token_urlsafe(48))'`. Never commit secrets. The example uses `JWT_SECRET_KEY`, matching the actual application.

For a new installation only, create the PostgreSQL database:

```sh
createdb -h localhost -p 5432 -U postgres smart_roadmap
```

Apply and verify migrations from `backend/`:

```sh
alembic upgrade head
alembic current
alembic check
uvicorn app.main:app --reload --no-access-log
```

Swagger: http://127.0.0.1:8000/docs. OpenAPI: http://127.0.0.1:8000/openapi.json. Liveness: `/api/v1/health`. Database readiness: `/api/v1/database`.

Run all commands from `backend/` so imports use `app.*`. Application data is preserved by the additive migrations. Current head is `707dca5a8bca`.

## API overview

| Prefix | Behavior |
| --- | --- |
| `/api/v1/auth` | Register, login, refresh, logout, password changes, sessions |
| `/api/v1/users/me` | Current account, email/username changes, deactivation |
| `/api/v1/users/me/profile` | GET and PUT profile |
| `/api/v1/skills` | Shared skill catalog |
| `/api/v1/users/me/skills` | Personal skills and proficiency |
| `/api/v1/users/me/goals` | Goal CRUD; `status`, `priority` filters |
| `/api/v1/users/me/goals/{id}/skills` | Ordered required skills for a goal |
| `/api/v1/users/me/goals/{id}/recommendations` | Unmet skill requirements and resources |
| `/api/v1/users/me/goals/{id}/generate-roadmap` | POST to persist a personalized roadmap |
| `/api/v1/users/me/topics` | Topic CRUD, optional `search` |
| `/api/v1/users/me/topics/{id}/resources` | Resource CRUD |
| `/api/v1/users/me/roadmaps` | Roadmap CRUD |
| `/api/v1/users/me/roadmaps/{id}/milestones` | Ordered milestone CRUD |
| `/api/v1/users/me/roadmaps/{id}/milestones/{id}/tasks` | Ordered task CRUD |
| `/api/v1/users/me/roadmaps/{id}/progress` | Computed task completion percentage |
| `/api/v1/users/me/projects` | Project CRUD, optional `search` |
| `/api/v1/users/me/projects/{id}/skills` | Project skill associations |
| `/api/v1/users/me/assessments` | Create, list, get, delete self-assessments; `skill_id` filter |
| `/api/v1/users/me/notifications` | List, `unread` filter; PATCH `/{id}/read` |
| `/api/v1/users/me/analytics` | Personal aggregate counts |
| `/api/v1/admin/users`, `/api/v1/admin/metrics` | Administrator-only operational views |

Growing lists accept `offset` (default 0) and `limit` (default 50, maximum 100). Recommendations return the complete set of unmet requirements for the selected goal. Standard errors use `{"detail": ...}`. An unavailable private object returns 404 for both missing objects and objects owned by another user. PATCH preserves omitted values and permits clearing nullable fields. Goal titles are trimmed and limited to 200 characters; descriptions to 5,000; target roles to 150.

Bearer authentication uses `Authorization: Bearer <access_token>`. Password, email, and username changes invalidate older access JWTs through a per-user token version. Account deactivation blocks access immediately. Logout and session revocation revoke refresh sessions; existing access JWTs remain usable until expiration unless credentials change or the account is deactivated.

## Generating a roadmap

1. An administrator creates shared skills, or reuse the existing catalog.
2. Add your current skills and proficiency (`beginner`, `intermediate`, `advanced`, `expert`).
3. Create an active goal with a title, optional target role and date.
4. POST required skills to `/goals/{id}/skills`, including `skill_id`, `required_proficiency`, and unique nonnegative `position`.
5. Optionally add personal topics/resources, completed projects with skill associations, and assessment scores from 0 to 100.
6. GET recommendations, then POST `/goals/{id}/generate-roadmap`.
7. Update task status to `pending`, `in_progress`, or `completed`. Progress is calculated from current task state, with 0% for an empty roadmap.

The engine is deterministic. It uses the explicit requirement order as the learning sequence. Current proficiency is compared with required proficiency; the latest assessment can conservatively lower a self-reported level. Score thresholds are 50 for intermediate, 75 for advanced, and 90 for expert. Completed project counts influence practice task wording, not proficiency. Resource tasks use the owner's linked resources. Generation creates the roadmap, milestones, tasks, and notification in one transaction. Repeated requests create separate roadmaps; inactive goals or goals with no unmet requirements return 422.

Target-role text does not automatically supply a curriculum. Curated role catalogs, prerequisite graphs, verified assessments, external AI, email/push delivery, and automatic scheduling are extensions beyond this initial implementation.

## Administrator setup

Register an active account normally, then an operator with database access can run:

```sh
cd backend
python -m app.admin your-account@example.com
```

There is no public administrator self-enrollment endpoint. Existing accounts default to non-admin. Promote the intended account before editing the shared skill catalog; catalog mutations now return 401 without authentication and 403 for non-admins.

## Tests and checks

```sh
cd backend
ruff check app tests
python -m compileall -q app alembic
python -m pytest -q
python tests/run_postgres.py
python tests/check_migrations.py
```

The default suite uses an ephemeral SQLite database with foreign keys enabled and overrides the real database dependency. This does not replace PostgreSQL in the application. The PostgreSQL runner uses the configured database but creates isolated schemas in an outer transaction and rolls them back after every test. It never resets or truncates application tables. Migration verification similarly performs upgrades, downgrades, and re-upgrades in a disposable schema, checking enum cleanup and model consistency. The database account needs schema-creation permission for these checks; CI uses a dedicated ephemeral PostgreSQL instance.

Tests cover authentication regressions, profiles, skills, complete goal lifecycle, ownership, validation, dates, persistence, cascades, resource safety, roadmap progress, projects, assessments, generation, notifications, analytics, JWT revocation, administrator authorization, Swagger, and sanitized failures.

## Docker

Compose creates a separate PostgreSQL volume; it does not replace the existing localhost database or bind its port. The API binds to localhost port 8001 by default.

```sh
cp .env.docker.example .env.docker
# Set unique random POSTGRES_PASSWORD and JWT_SECRET_KEY values.
# Use a URL-safe database password, since Compose builds the connection URL.
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
python backend/tests/smoke_docker.py
python backend/tests/concurrency_docker.py
docker compose --env-file .env.docker exec api alembic check
```

Swagger: http://127.0.0.1:8001/docs. A one-shot migration service waits for database health and finishes before the non-root API starts. To promote an account in this separate database:

```sh
docker compose --env-file .env.docker exec api python -m app.admin your-account@example.com
```

The optional smoke/concurrency scripts create dedicated accounts in the Docker database and deactivate them afterward.

Stop containers with `docker compose --env-file .env.docker stop`. Avoid removing the PostgreSQL volume unless intentionally deleting that environment's data.

## Deployment and operations

GitHub Actions runs lint, syntax checks, SQLite/PostgreSQL API tests, migration round trips, an image build, live container smoke tests, and concurrent refresh/credential tests. It does not publish images or deploy without a selected provider and credentials. See [deployment runbook](docs/deployment.md) for the concrete production preparation and release steps.

Set `ENVIRONMENT=production`, a random secret of at least 32 characters, a PostgreSQL connection, explicit `ALLOWED_HOSTS`, and explicit `CORS_ORIGINS`. Wildcard hosts/origins are rejected in production. Interactive documentation is disabled in production; `/openapi.json` remains available. Logging includes generated request IDs, route templates, status, and duration; it omits query strings, authorization headers, request bodies, SQL parameters, and raw tokens. Request counters are per worker and require central aggregation for multiple workers. HTTPS termination, distributed authentication rate limits, database backups, alert destinations, and secret rotation belong in the deployment configuration.

## Structure

```text
backend/
  app/
    core/          Configuration, security, dependencies, logging
    models/        SQLAlchemy entities and relationships
    schemas/       Pydantic validation and response models
    crud/          Persistence and owner-scoped queries
    services/      Recommendation and generation logic
    routers/       Versioned HTTP endpoints
    db/            Engine, sessions, dependency
    admin.py       Explicit operator bootstrap command
    main.py        Application assembly
  alembic/         Additive schema migrations
  tests/           API regressions and safe PostgreSQL verification
  Dockerfile
  requirements.txt
  requirements-dev.txt
compose.yaml
.github/workflows/backend.yml
```
