# Production deployment runbook

The backend and container configuration are prepared. A hosting provider, domain, production database, and deployment credentials must be selected before a live release. No live infrastructure has been provisioned or published.

## Environment and infrastructure

- Deploy the non-root backend image with a managed PostgreSQL database using a dedicated least-privilege runtime account. Use a separate migration account with DDL permissions.
- Set `ENVIRONMENT=production`, `DATABASE_URL`, `JWT_SECRET_KEY`, `ALLOWED_HOSTS` (a JSON list containing the public domain and internal health-check hosts), and `CORS_ORIGINS` (a JSON list of authorized frontend origins).
- Store secrets in the provider's secret manager; never bake `.env` into an image. The Docker ignore file excludes environment files.
- Terminate HTTPS at the provider gateway and configure trusted proxy forwarding there. Bind the API on a private interface; the example Compose binds only localhost for development.
- Apply distributed rate limits and body-size limits at the gateway, particularly on registration, login, refresh, and roadmap generation. The application does not provide distributed throttling.
- Configure PostgreSQL TLS and encrypted backups with point-in-time recovery. Test restoration before accepting production traffic.

## Release

1. Require the Backend GitHub Actions checks to pass. Build and publish an immutable image identified by commit SHA in the selected registry.
2. Take a database backup. Inspect pending Alembic migrations against a staging clone.
3. Run `alembic upgrade head` once as a release job, then `alembic current` and `alembic check`. Do not run concurrent migration jobs.
4. Roll out the image, verify `/api/v1/health` and `/api/v1/database`, and exercise login plus owner-scoped goal and roadmap operations using dedicated smoke accounts.
5. Bootstrap the intended administrator with `python -m app.admin <email>` from an authorized operator session.
6. Set alerts for sustained 5xx responses, database readiness failures, high latency, abnormal authentication failures, and backup failures.

## Monitoring

Collect stdout logs centrally. They contain generated request IDs and route templates, without token values, passwords, SQL parameters, or request bodies. `/api/v1/admin/metrics` exposes request counts for one worker; use the hosting provider's gateway metrics or a central exporter for fleet-wide aggregation. Liveness checks do not require a database. Readiness checks do.

## Rollback and recovery

Prefer rolling back the application image while retaining the additive schema. Database downgrades can delete feature data and require an explicit, reviewed recovery plan. Test downgrade compatibility in staging; never downgrade the production database merely to verify a migration. Restore backups only with an approved incident procedure.

JWT secret rotation invalidates all access JWTs; revoke refresh sessions when rotating a compromised key. Credential changes already invalidate the affected user's access JWTs. Administrator access is explicit and should be limited to intended operators.

## Remaining decisions

Provider/region, public domain, managed PostgreSQL sizing, registry, release credentials, frontend CORS origins, backup retention, gateway throttling values, alert destinations, and operational owners are not available in this repository. Deployment automation should be added for the chosen provider once those decisions are supplied.
