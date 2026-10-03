# Smart Roadmap frontend

React 19 + TypeScript + Vite, with React Router, TanStack Query, Radix dialogs, Sonner notifications, Lucide icons, and locally bundled DM Sans / Manrope fonts. Every production view uses the FastAPI backend. The landing illustration is conceptual, and dashboard counts and roadmap progress come from the API.

## Run locally

Start the existing backend from the repository root:

```sh
docker compose --env-file .env.docker up -d --wait api
```

Then in `frontend/`:

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to http://127.0.0.1:8001. Set `API_PROXY_TARGET` if your local API runs on a different port. Restart Vite after changing environment values.

`VITE_API_URL` defaults to an empty string for same-origin requests. For a separately hosted API, set it to the **origin**, such as `https://api.example.com`, with no `/api/v1` suffix, and configure the backend's CORS and allowed hosts. Vite variables are public build-time configuration: never put database credentials, JWT signing secrets, or private API keys in them.

## Build and verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The committed OpenAPI snapshot was exported from the actual application before implementation. Regenerate its TypeScript definitions after a deliberate backend contract update:

```sh
npm run api:types
```

See [the implementation matrix](../docs/frontend-matrix.md) for exact endpoints, schemas, page mappings, and limits. No global resource endpoint or assessment question/answer endpoint exists in the current backend.

## Real backend browser tests

Start the Compose API, then:

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts Vite if it is not already running. The suite creates dedicated accounts and a catalog skill, promotes its dedicated administrator through the existing `app.admin` operator command, and verifies real HTTP responses. It requires Docker and the repository-root `.env.docker`; it does not promote your personal account. Teardown removes the generated learning data and catalog skill and deactivates test accounts. The backend intentionally retains deactivated account records. Credentials are stored temporarily in ignored `tests/.runtime.json` with owner-only permissions.

To test the production container instead:

```sh
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Tests cover registration/login/logout and route protection, persisted profiles, skills, goal targets, topic resources, generation, task progress, projects, self-assessments, actual refresh, ownership denial, validation and keyboard focus, mobile/tablet layouts, administrator catalog CRUD, manual roadmap CRUD, and account/session changes. Unit tests exercise auth races, sanitized errors, typed form values, invalid fields and unsafe links. Server pagination is verified against actual backend offsets and filters; accessibility checks use axe against rendered pages and dialogs. Production data is never mocked; unit tests isolate transport and form behavior.

Screenshots, reports and failure traces stay in ignored `test-results/` and `playwright-report/`. Local traces can contain temporary test authentication headers; do not publish them. CI disables network traces and uploads the HTML report and screenshots.

## Production container

From the repository root:

```sh
docker compose --env-file .env.docker up --build -d --wait
```

Open http://127.0.0.1:3000 (`FRONTEND_PORT` changes the host port). The multistage image serves the production bundle through non-root Nginx on container port 8080. Nginx forwards `/api/` to the API service, provides history fallback for direct React Router links, caches versioned assets, and applies security headers. Fonts are included in the bundle. No frontend secrets or external font request are required.

The built-in Nginx configuration uses same-origin API requests and an internal `Host: localhost` header accepted by the current API trust configuration. Separate API hosting requires rebuilding with public `VITE_API_URL`, matching CORS, and an explicit `connect-src` change in your server policy. Public deployment still needs a domain, TLS termination and the deployment provider configuration.

## Architecture and behavior

- `src/api/client.ts`: JSON transport, validation/error mapping, tab-scoped session storage, a single refresh request shared by concurrent failures, and safeguards against logout/account changes while requests are pending.
- `src/api/domains.ts`: typed domain methods for actual backend operations. Nested resources and tasks preserve parent IDs. User skill updates/deletes use the catalog skill ID required by the backend.
- `src/types/openapi.ts`: generated request/response definitions.
- `src/app/`: session context, private route shell, route splitting, error boundary and query cache.
- `src/components/`: shared controls, accessible forms/dialogs, navigation, state displays and skill selection.
- `src/pages/`: real API-backed feature views. Mutations invalidate cached queries so lists, analytics, progress and recommendations stay consistent.
- `src/styles.css`: shared visual tokens, responsive workspace/landing layouts, visible focus and reduced-motion support.

Sessions survive reload in the same browser tab and clear on logout or rejected refresh. Tokens are accessible to JavaScript because the existing API issues bearer tokens in JSON; an HttpOnly-cookie architecture would require a separate backend change. The static server uses a content security policy, React renders text safely, and resource URLs are limited to HTTP(S). Refresh coordination is intentionally tab-scoped.

Skills are a shared catalog. Normal users manage their own proficiency; administrators additionally see catalog CRUD after the existing admin metrics endpoint confirms authorization. Assessments are self-reported scores, not examinations. Recommendations and generated roadmaps use explicit goal skill targets. Generation creates a new roadmap on each successful request; it does not overwrite an existing plan.

## Latest local verification

14 unit tests and all 10 browser journeys passed against the production Nginx frontend and real PostgreSQL-backed API. Type checking, linting, builds, container health, security headers and deep-link fallback passed. The automated WCAG checks cover the landing page, dashboard, goal form and mobile navigation. The GitHub Actions workflow is configured; its hosted execution has not been run in this session.
