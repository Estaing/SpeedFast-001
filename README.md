# VinFast EV Fleet API

Production-grade Node.js REST API for managing VinFast electric vehicles, owners, and real-time charge telemetry. Built with a clean layered architecture: controller → service → repository, comprehensive tests at three levels, and full observability out of the box.

---

## Stack

| Concern | Choice | Why |
|---|---|---|
| HTTP framework | Fastify 5 | 2–3× faster than Express; schema-first validation & serialization |
| Database | PostgreSQL 16 + Prisma | Type-safe queries, versioned migrations, ACID transactions |
| Cache / sessions | Redis 7 (ioredis) | Refresh-token store with rotation, paginated response caching |
| Background jobs | BullMQ | Async telemetry polling decoupled from the HTTP lifecycle |
| Validation | Zod | Fail-fast env validation + request body parsing |
| Auth | JWT (15 min access) + Redis UUID (7 day refresh, rotated per use) | Short-lived access tokens + instantly revocable sessions |
| API docs | OpenAPI 3 via `@fastify/swagger` | Interactive UI live at `/docs` |
| Observability | OpenTelemetry traces + Prometheus `/metrics` | Distributed tracing + latency histograms |
| Testing | Vitest + Testcontainers | Unit / integration (real ephemeral DB) / e2e — 24 tests |
| Containers | Multi-stage Docker, non-root user | Minimal image, no build tools in production layer |
| CI/CD | GitHub Actions | Lint → unit → integration/e2e → Docker build → deploy skeleton |

---

## Project Structure

```
src/
├── config/env.js          # Zod-validated env — fail-fast on bad config
├── modules/
│   ├── auth/              # register, login, refresh (rotation), logout
│   └── vehicles/          # CRUD + charge telemetry, ownership-scoped
│       ├── *.schema.js    # Zod input validation
│       ├── *.repository.js  # Prisma queries only — no business logic
│       ├── *.service.js   # all rules: auth, cache, metrics — no HTTP coupling
│       ├── *.controller.js  # HTTP glue only
│       └── *.routes.js    # route registration + OpenAPI schemas
├── middleware/
│   ├── auth.plugin.js     # authenticate / requireRole Fastify decorators
│   ├── error-handler.js   # centralised error → HTTP status mapping
│   └── metrics.plugin.js  # Prometheus request histograms (auto, per-route)
├── lib/                   # prisma, redis, queue, metrics singletons
├── app.js                 # plugin wiring + DI + health checks → buildApp()
├── server.js              # HTTP entrypoint (graceful shutdown on SIGTERM/INT)
├── worker.js              # separate BullMQ worker process (Pino logger)
└── tracing.js             # OpenTelemetry bootstrap — must be imported first
```

---

## Getting Started

### Option A — Docker Compose (recommended, everything included)

```bash
cp .env.example .env
# Fill in real JWT secrets (minimum 32 chars each):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_REFRESH_SECRET

docker compose up --build
```

Services started: API on :3000, Postgres on :5432, Redis on :6379, Jaeger UI on :16686, Prometheus on :9090.

### Option B — Native macOS

```bash
brew install node@20 postgresql@16 redis
brew services start postgresql@16 redis

createdb vinfast_ev_db
psql vinfast_ev_db -c "CREATE USER vinfast WITH PASSWORD 'vinfast_dev_pw';"
psql vinfast_ev_db -c "GRANT ALL PRIVILEGES ON DATABASE vinfast_ev_db TO vinfast;"
psql vinfast_ev_db -c "ALTER DATABASE vinfast_ev_db OWNER TO vinfast;"

cp .env.example .env  # edit JWT_SECRET and JWT_REFRESH_SECRET with real random values

npm install
npx prisma generate
npx prisma migrate dev --name init

npm run dev          # API on :3000
npm run dev:worker   # background worker (separate terminal)
```

Verify:
```bash
curl http://localhost:3000/health/ready   # → {"status":"ready"}
```

---

## API Reference

Interactive docs auto-generated at **http://localhost:3000/docs**.

### Auth endpoints (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Get access + refresh token pair |
| POST | `/refresh` | — | Rotate refresh token, get new pair |
| POST | `/logout` | — | Revoke refresh token immediately |

### Vehicle endpoints (`/api/v1/vehicles`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Bearer | Register a new vehicle |
| GET | `/` | Bearer | List your vehicles (paginated) |
| GET | `/:id` | Bearer | Get vehicle by ID (owner or ADMIN) |
| PUT | `/:id/charge-status` | Bearer | Update live telemetry |
| DELETE | `/:id` | Bearer | Remove vehicle (owner or ADMIN) |

### Quick curl flow

```bash
# Register
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@vinfast.vn","password":"Secure123!"}' | jq

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@vinfast.vn","password":"Secure123!"}' | jq -r .accessToken)

# Create vehicle
curl -s -X POST http://localhost:3000/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vin":"VF8X12345678ABCDE","model":"VF8","batteryCapacity":87.7}' | jq
```

---

## Testing

```bash
npm test                    # unit tests — 24 tests, ~2s, no external deps
npm run test:integration    # real ephemeral Postgres + Redis via Testcontainers (needs Docker)
npm run test:e2e            # full HTTP stack via Fastify inject + real DB (needs Docker)
npm run test:all            # all three tiers with coverage report
```

**Test coverage** is enforced in CI with minimums: 75% lines, 70% branches. The coverage report is uploaded as a CI artifact on every main/develop push.

---

## Frontend Integration

This API is consumed by any HTTP client. Recommended integration patterns:

- **Web (React/Vue/Next.js)**: Use `fetch` or `axios`. Store the `accessToken` in memory (not localStorage) and the `refreshToken` in an `httpOnly` cookie. On 401 responses, call `/auth/refresh` automatically with an interceptor, then retry the failed request. CORS is open in development and locked to `vinfast.vn` domains in production.
- **Mobile (React Native / Flutter)**: Store the refresh token in the platform secure store (Keychain on iOS, Keystore on Android). The same token rotation flow applies.
- **Admin dashboards**: Use the `ADMIN` role — tokens issued for admin accounts can access any user's vehicles. Guard this role in your user creation flow (only a seeded admin or a service account should be able to create ADMIN users).

Example React auth hook outline:
```js
async function apiFetch(url, options = {}) {
  let res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${getToken()}` }});
  if (res.status === 401) {
    const { accessToken } = await refreshTokens();  // POST /auth/refresh
    setToken(accessToken);
    res = await fetch(url, { ...options, headers: { Authorization: `Bearer ${accessToken}` }});
  }
  return res;
}
```

---

## Deployment

The project ships a complete CI/CD pipeline in `.github/workflows/`:

- **`ci.yml`** — runs on every push/PR to `main` and `develop`: lint → unit tests → integration/e2e tests → coverage upload → Docker image build & push to `ghcr.io` (main only).
- **`cd.yml`** — triggers automatically when CI passes on `main`, gated by a `production` GitHub environment (add approval rules there). Currently a scaffold — fill in your real deploy target:

```bash
# Fly.io
flyctl deploy --image ghcr.io/$REPO:$SHA

# Railway
railway up

# AWS ECS
aws ecs update-service --cluster prod --service vinfast-api --force-new-deployment
```

**Required GitHub secrets** for the full pipeline:
```
JWT_SECRET                 # ≥ 32 chars random hex
JWT_REFRESH_SECRET         # ≥ 32 chars random hex
PRODUCTION_DATABASE_URL    # postgresql://...
```

---

## Known Limitations / Roadmap

| Area | Status | Notes |
|------|--------|-------|
| Telematics gateway | Stub | `worker.js:fetchTelemetryFromGateway` returns random data — replace with real VinFast IoT API call |
| `requireRole` guard | Implemented, not wired | `app.requireRole('ADMIN')` is ready to attach to any route as an `onRequest` hook |
| TECHNICIAN role | Access limited | Currently TECHNICIAN has the same access scope as CUSTOMER — a deliberate placeholder |
| Refresh token cookie | Not implemented | For browser clients, moving the refresh token to an `httpOnly` cookie adds CSRF protection |
| Rate limit per-user | Global only | Could be tightened to per-IP-per-user with `@fastify/rate-limit` key functions |
