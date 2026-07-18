# Local Postgres (`infra/`)

Docker Compose stack for local development. Runs a pgvector-enabled Postgres 16
that the app, pipeline, and cron talk to directly via `DATABASE_URL`.

## Setup

1. `cd infra`
2. `cp .env.example .env` and adjust if needed (`APP_NAME`, `DB_USER`, `DB_PASSWORD`).
3. `docker compose up -d` (or `make up`).

Postgres listens on **5432** (loopback only). Data persists under `postgres/data/`
(gitignored). On a fresh volume the container auto-applies `postgres/scripts/init.sql`
and `packages/data/schema.sql` (pgvector extension + `clusters` + `bucket_anchors`).

## Application config

Point `DATABASE_URL` (in `apps/web/.env`) at the container. Default:

`postgresql://2mintoday:2mintoday@localhost:5432/2mintoday`

## Schema and seed

Schema lives in `packages/data/schema.sql` (single source of truth, idempotent).

- Fresh volume: applied automatically on first `docker compose up`.
- Existing volume: apply manually with `pnpm --filter @2min.today/web run db:setup`.

Seed the classification anchors (needs `GEMINI_API_KEY`):

`pnpm --filter @2min.today/web run seed:anchors`
