# PayFlow — Phase 1 Plan: Architecture & Setup

## Top-Level Overview

**Goal:** Produce the complete architectural foundation for PayFlow — a portfolio-grade distributed payment infrastructure project. No implementation code is written in this phase (except minimal placeholder Dockerfiles so `docker-compose up` is runnable).

**Scope:**
- Full monorepo folder scaffold (all services, shared libraries, frontend)
- Architecture, ER, service-interaction, auth-flow, and payment-lifecycle diagrams in `/docs`
- Complete API surface document (18 endpoints) in `/docs`
- Architecture Decision Records (ADRs) for all 8 required decisions
- `docker-compose.yml` skeleton (all services declared, minimal placeholder Dockerfiles so the full topology starts)
- Root-level tooling config: ESLint, Prettier, Husky, Conventional Commits, root `tsconfig.base.json`, root `package.json` with workspaces

**Not in scope:** Any real TypeScript business logic, Prisma schema, migrations, JWT logic, or route handlers. Those begin in Phase 2. Placeholder Dockerfiles are the sole exception — just enough for `docker-compose up` to succeed and show the topology.

**Project name:** PayFlow
**Workspace root:** `c:\Users\LakshitaGupta\Documents\app`

---

## Correction Log (applied before plan was finalised)

The following issues were identified and corrected:

1. **Settlements data model** — Settlements are computed on-the-fly by summing `ledger_entries` grouped by `merchant_id` and time period. No separate `settlements` table. Rationale: keeps the append-only ledger as the single source of financial truth, avoids a denormalized aggregate that could drift. Noted in `docs/api-surface.md` next to the settlements endpoint and reflected in the ER diagram.

2. **Audit log write path** — Each service publishes an `audit.*` event to RabbitMQ. The **Notification Service** consumes `audit.*` events in a dedicated `src/audit/` sub-folder (separate from its `payment.*` handling) and writes to `audit_logs`. This avoids a 6th microservice, mirrors the notification consumer pattern, and keeps services decoupled — consistent with the "don't over-fragment" principle already applied to the Ledger. `src/audit/` is also added to `services/shared/` for the shared `AuditEvent` type and publisher helper stub.

3. **8th ADR added** — `docs/adr/008-shared-database-vs-per-service.md` documents the deliberate choice of a single shared Postgres instance.

4. **Refresh token single-session constraint** — Storing one `refresh_token_hash` per user row means a new login on a second device invalidates the first session. This is a stated design choice, explicitly noted in `docs/diagrams/auth-flow.md` and ADR-004.

5. **Endpoint count corrected** — Auth (4) + Merchant (4) + Payment (5) + Admin (5) = **18 endpoints**. The plan states 18 throughout.

6. **Placeholder Dockerfiles in Phase 1** — Each of the 5 app services gets a minimal `Dockerfile` (`FROM node:20-alpine` + no-op `CMD`) so `docker-compose up` succeeds end-to-end and the full topology is observable. Real Dockerfiles with multi-stage builds and health checks are written in Phase 10.

7. **Audit consumer location decided** — `audit.*` events are consumed inside the Notification Service's `src/audit/` sub-folder, bound to a separate `audit_queue` in RabbitMQ. No 6th microservice. `services/shared/src/audit/` holds only the shared type definition and publisher helper.

---

## Sub-Task 1 — Monorepo Root Scaffold

**Intent:** Establish the top-level directory layout and shared tooling so every subsequent phase has a consistent, enforced foundation to build on.

**Expected Outcomes:**
- `package.json` at root configured as an npm workspace with entries for each service and the frontend
- `tsconfig.base.json` at root with `strict: true` and shared compiler options all service `tsconfig.json` files will extend
- `.eslintrc.js` and `.prettierrc` at root enforcing the coding standards from the brief
- `.husky/pre-commit` hook running lint + tests
- `.commitlintrc.js` enforcing Conventional Commits
- `.gitignore` appropriate for a Node/TypeScript monorepo
- `.env.example` at root documenting every required environment variable across all services
- `README.md` stub with project name, architecture diagram placeholder, and setup instructions placeholder

**Todo List:**
1. Create root `package.json` with `"workspaces": ["services/*", "frontend"]`, dev dependencies for ESLint, Prettier, Husky, commitlint, and TypeScript
2. Create `tsconfig.base.json` with `strict: true`, `target: ES2021`, `module: CommonJS`, `moduleResolution: node`, `esModuleInterop: true`, `skipLibCheck: true`
3. Create `.eslintrc.js` extending `@typescript-eslint/recommended`, rules: no implicit `any`, no unused vars
4. Create `.prettierrc` with `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`, `semi: true`
5. Create `.husky/pre-commit` running `npm run lint && npm run test --if-present` from root
6. Create `.commitlintrc.js` using `@commitlint/config-conventional`
7. Create `.gitignore` covering `node_modules`, `dist`, `.env`, `*.log`, `coverage`
8. Create `.env.example` with every variable referenced across all services (DB URLs, JWT secrets, Redis URL, RabbitMQ URL, port numbers, rate-limit thresholds) — values are placeholders, never real secrets
9. Create `README.md` stub with sections: Overview, Architecture, ER Diagram, Sequence Diagrams, Folder Structure, Setup Instructions, Trade-offs & Future Work

**Relevant Context:** No existing files. This is a greenfield monorepo. npm workspaces chosen over Turborepo/Nx to keep the toolchain minimal for a portfolio project.

**Status:** [ ] pending

---

## Sub-Task 2 — Service Folder Scaffold

**Intent:** Create the empty directory tree for every service and the frontend so the architecture is visible as a folder structure before any code is written. Each service follows the canonical internal layout from the brief.

**Expected Outcomes:**
- Five service directories under `services/`: `api-gateway`, `auth-service`, `merchant-service`, `payment-service`, `notification-service`
- Each service directory contains the canonical sub-folders: `src/controllers`, `src/routes`, `src/services`, `src/repositories`, `src/middlewares`, `src/validators`, `src/config`, `src/utils`, `tests/`
- Each service has a stub `package.json` (name, version, main, scripts: build/start/test/lint), a `tsconfig.json` extending `../../tsconfig.base.json`, and a `.env.example` scoped to that service's variables
- `services/notification-service/` has two additional sub-folders: `src/notification/` (payment.* consumer) and `src/audit/` (audit.* consumer writing to `audit_logs`) — these are sibling modules within the same process, bound to separate RabbitMQ queues (`notification_queue` and `audit_queue`)
- `services/payment-service/` has an additional `src/ledger/` sub-folder — the Ledger is an internal module, not a separate microservice
- `services/shared/` with sub-folders: `src/errors/`, `src/logging/`, `src/messaging/`, `src/types/`, `src/audit/` — the `src/audit/` module holds only the shared `AuditEvent` type definition and a RabbitMQ publisher helper stub (implementation in Phase 8)
- `frontend/` directory with a Vite + React + TypeScript scaffold stub (`package.json`, `tsconfig.json`, `vite.config.ts` placeholder)
- `docs/adr/` and `docs/diagrams/` directories
- `.gitkeep` files in every empty leaf directory so git tracks the structure
- Root-level `ARCHITECTURE.md` summarising service responsibilities, explicitly noting that Ledger is internal to Payment Service and that audit event consumption lives inside Notification Service

**Todo List:**
1. Create `services/api-gateway/` with full internal folder tree + stub `package.json` and `tsconfig.json`
2. Create `services/auth-service/` with full internal folder tree + stub files
3. Create `services/merchant-service/` with full internal folder tree + stub files
4. Create `services/payment-service/` with full internal folder tree + stub files; add `src/ledger/` sub-folder
5. Create `services/notification-service/` with full internal folder tree + stub files; add `src/notification/` and `src/audit/` sub-folders
6. Create `services/shared/` with `src/errors/`, `src/logging/`, `src/messaging/`, `src/types/`, `src/audit/` and a stub `package.json`
7. Create `frontend/` with Vite + React + TS stub structure
8. Create `docs/adr/` and `docs/diagrams/` directories
9. Write root-level `ARCHITECTURE.md`

**Relevant Context:** The `src/audit/` module in Notification Service and in `services/shared/` are stubs only in Phase 1. The RabbitMQ binding for `audit_queue` → `audit.*` and the actual consumer logic are implemented in Phase 8.

**Status:** [ ] pending

---

## Sub-Task 3 — Documentation: Diagrams & API Surface

**Intent:** Produce the architectural documentation that drives every subsequent implementation phase. Diagrams must be agreed before code is written so that implementation conforms to design.

**Expected Outcomes:**
- `docs/diagrams/er-diagram.md` — ER diagram (Mermaid `erDiagram`) covering all 7 tables; a comment in the diagram notes that settlements are NOT a table and are derived by summing `ledger_entries` grouped by `merchant_id` + time window; `ledger_entries` is annotated as append-only
- `docs/diagrams/service-interaction.md` — Service interaction diagram showing: Client → API Gateway → each service; Redis and PostgreSQL connections per service; two async RabbitMQ lanes: (1) `payment.*` → `notification_queue` → Notification Service notification module, (2) `audit.*` → `audit_queue` → Notification Service audit module → `audit_logs` table
- `docs/diagrams/auth-flow.md` — Auth sequence diagram covering register, login, authenticated request, token refresh, and logout; includes explicit note: "A new login overwrites `refresh_token_hash` in the `users` row — deliberate single-session-per-user design"
- `docs/diagrams/payment-lifecycle.md` — Payment lifecycle sequence diagram covering new idempotency key path, duplicate key path, exception/rollback path, and async RabbitMQ fan-out
- `docs/api-surface.md` — All **18 endpoints** (Auth 4, Merchant 4, Payment 5, Admin 5) with method, path, auth requirement, idempotency-key requirement, request/response shape, expected HTTP codes; `GET /merchants/{id}/settlements` entry states "computed from `ledger_entries` aggregation — no settlements table"

**Todo List:**
1. Write `docs/diagrams/er-diagram.md` with Mermaid ER diagram — all 7 tables, columns with types, PKs, FKs; settlement and append-only notes as comments
2. Write `docs/diagrams/service-interaction.md` — label every arrow with protocol; show both async RabbitMQ lanes (payment.* and audit.*) clearly distinguished
3. Write `docs/diagrams/auth-flow.md` — show refresh-token hash (not raw token) in DB, token rotation on refresh, and explicit single-session constraint note
4. Write `docs/diagrams/payment-lifecycle.md` — all three idempotency paths and async fan-out
5. Write `docs/api-surface.md` — 18 endpoints, full request/response spec, settlements computation note

**Relevant Context:** Diagrams use Mermaid so they render natively on GitHub. Avoid double-quotes and parentheses inside Mermaid square-bracket labels. The two RabbitMQ async lanes in the service-interaction diagram must be visually distinct — payment.* and audit.* serve different purposes and bind to different queues within the same broker.

**Status:** [ ] pending

---

## Sub-Task 4 — Architecture Decision Records (ADRs)

**Intent:** Document all 8 architectural decisions as first-class ADR files. Each must be genuinely defensible with honest trade-off analysis — these are interview-critical deliverables.

**Expected Outcomes:**
- 8 ADR files under `docs/adr/`, following the brief's template: Title, Problem, Alternatives Considered, Decision, Trade-offs
- ADRs reference the design targets from section 8a (1K concurrent users, 100 req/s, 100K payments) where relevant

**Todo List:**
1. Write `docs/adr/001-rabbitmq-vs-kafka.md` — RabbitMQ chosen for simpler ops, push-based delivery, per-message acknowledgement, and free CloudAMQP tier; Kafka rejected as overkill at this message volume; trade-off: no log replay / event sourcing
2. Write `docs/adr/002-postgresql-vs-mongodb.md` — PostgreSQL chosen for ACID guarantees and FK integrity; MongoDB rejected because schema flexibility is a liability in a payments domain; trade-off: horizontal write sharding is harder
3. Write `docs/adr/003-redis-vs-memcached.md` — Redis chosen for atomic `SET NX EX` (idempotency) and `INCR + EXPIRE` (rate limiting); Memcached rejected for lacking atomic conditional-set; trade-off: heavier footprint than Memcached for pure caching
4. Write `docs/adr/004-jwt-refresh-tokens-vs-sessions.md` — JWT + refresh tokens chosen for stateless scaling; sessions rejected for requiring shared store or sticky routing; **explicitly states:** single `refresh_token_hash` per user is a deliberate single-session-per-user design — new login on device B invalidates device A's refresh token
5. Write `docs/adr/005-docker-compose-vs-kubernetes.md` — Docker Compose chosen for free-tier single-VM deployment; K8s rejected as ops overhead; service boundaries allow K8s migration as a config change, not an architectural one
6. Write `docs/adr/006-append-only-ledger-vs-mutable-balance.md` — Append-only chosen for auditability and to eliminate lost-update races; trade-off: balance requires `SUM()` aggregation, acceptable at 100K entries with composite index on `(payment_id, created_at)`
7. Write `docs/adr/007-no-saga-orchestration.md` — Saga rejected because the payment flow runs within a single service + single DB; `compensate()` hook stubs are provided so a Saga orchestrator can be added without a rewrite; documented as deliberate scoping decision
8. Write `docs/adr/008-shared-database-vs-per-service.md` — Shared Postgres chosen for portfolio simplicity; trade-off: services are not independently deployable at the data layer; explicitly flagged as a known microservices anti-pattern; future work: per-service schemas or separate DB instances

**Relevant Context:** ADRs are numbered with zero-padded 3-digit prefix. The single-session constraint in ADR-004 must be consistent with the statement in `docs/diagrams/auth-flow.md`.

**Status:** [ ] pending

---

## Sub-Task 5 — Docker Compose Skeleton + Placeholder Dockerfiles

**Intent:** Define the complete `docker-compose.yml` and add a minimal placeholder `Dockerfile` to each app service so `docker-compose up` succeeds end-to-end and the full 10-service topology is observable. The placeholder Dockerfiles are not the real build — they are replaced in Phase 10.

**Expected Outcomes:**
- `docker-compose.yml` at repo root declaring all 10 services with correct ports, network, volumes, and `env_file` references
- A minimal placeholder `Dockerfile` in each of the 5 app service directories — just enough for `docker-compose up` to build and start all containers without error
- Infrastructure services use pinned official Docker Hub images: `postgres:16-alpine`, `redis:7-alpine`, `rabbitmq:3.13-management-alpine`, `prom/prometheus:v2.52.0`, `grafana/grafana:10.4.2`
- Port mappings: Gateway 3000, Auth 3001, Merchant 3002, Payment 3003, Notification 3004, Postgres 5432, Redis 6379, RabbitMQ 5672 + management UI 15672, Prometheus 9090, Grafana 3005
- A shared `payflow-network` bridge network
- `depends_on` wiring: app services depend on `postgres`, `redis`, `rabbitmq`; `grafana` depends on `prometheus`
- Named volumes: `postgres-data` and `grafana-storage`
- `infra/prometheus/prometheus.yml` with scrape config targeting each app service's `/metrics` endpoint
- `infra/grafana/` placeholder directory (dashboards imported in Phase 12)
- `Makefile` with targets: `make up`, `make down`, `make logs`, `make ps`, `make infra` (starts only postgres, redis, rabbitmq — for use during Phases 2–8 before real app code exists)
- A comment block at the top of `docker-compose.yml` noting: placeholder Dockerfiles are used in Phase 1; real builds with health checks come in Phase 10; use `make infra` for local development in Phases 2–8

**Placeholder Dockerfile spec (same for all 5 app services):**
```dockerfile
FROM node:20-alpine
# Phase 1 placeholder — real build added in Phase 10
WORKDIR /app
CMD ["node", "-e", "console.log('PayFlow service placeholder — not implemented yet'); process.exit(0)"]
```
The container starts, prints a message, and exits cleanly. This is sufficient for `docker-compose up` to report all services as started.

**Todo List:**
1. Create placeholder `Dockerfile` in each of: `services/api-gateway/`, `services/auth-service/`, `services/merchant-service/`, `services/payment-service/`, `services/notification-service/`
2. Create `docker-compose.yml` with all 10 service definitions, `payflow-network`, named volumes, and the explanatory comment block
3. Create `infra/prometheus/prometheus.yml` with scrape jobs for all 5 app services
4. Create `infra/grafana/` with `.gitkeep`
5. Create `Makefile` with `up`, `down`, `logs`, `ps`, and `infra` targets

**Relevant Context:** The placeholder Dockerfiles use `process.exit(0)` so the container terminates with a success code. Docker Compose will show them as exited (0) rather than as crashing — this is acceptable for a skeleton. The infrastructure services (postgres, redis, rabbitmq) started via `make infra` will stay running and are the only ones needed during Phases 2–8 development.

**Status:** [ ] pending

---

## Plan Validation Checklist

Before switching to agent mode, confirm:
- [ ] Phase 1 scope is correct: scaffold + docs + ADRs + docker skeleton + placeholder Dockerfiles; zero real business logic
- [ ] All 8 ADR topics are covered (including shared-DB ADR)
- [ ] All 5 diagram/doc types are produced (ER, service interaction, auth flow, payment lifecycle, API surface)
- [ ] Settlements are modelled as a ledger aggregation, not a table, noted in both ER diagram and api-surface.md
- [ ] Audit event consumption is inside Notification Service `src/audit/`, not a 6th microservice; both `payment.*` and `audit.*` lanes are shown in the service-interaction diagram
- [ ] Single-session refresh token constraint is explicitly stated in auth-flow.md AND ADR-004
- [ ] API surface document states exactly 18 endpoints (Auth 4 + Merchant 4 + Payment 5 + Admin 5)
- [ ] Placeholder Dockerfiles exist for all 5 app services and `docker-compose up` completes without error
- [ ] `make infra` target starts only postgres, redis, rabbitmq for Phases 2–8 development
