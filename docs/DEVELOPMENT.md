# Development

Local workflow and smoke-testing the API routes.

## 1. Clone and install

```bash
git clone <repo-url>
cd 2min_today
pnpm install
cp apps/web/.env.example apps/web/.env
```

Fill in `apps/web/.env`:

- **`GEMINI_API_KEY`** — get one at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
- **`DATABASE_URL`** — the default value already matches the Docker setup in step 2; no change needed for local dev.
- **`CRON_SECRET`** — any string; protects `/api/digest`.

See `.env.example` for the full list of optional tuning vars (Flash pacing, thresholds, etc.).

## 2. Database (local Postgres via Docker)

```bash
cd infra
docker compose up -d
```

This starts `pgvector/pgvector:pg16` on `127.0.0.1:5432` (loopback only). On a **fresh volume**, the container auto-applies `infra/postgres/scripts/init.sql` and `packages/data/schema.sql` (the `vector` extension, `clusters`, `topic_anchors`, indexes) — nothing else to do.

If you already have a volume from before a schema change, apply it manually:

```bash
pnpm --filter @2min.today/web run db:setup
```

**Seed topic anchors (once per database)** — needs `GEMINI_API_KEY` and `DATABASE_URL` in `apps/web/.env`:

```bash
pnpm --filter @2min.today/web run seed:anchors
```

Run from the **repository root**. This uses `apps/web`'s `node_modules` (where `@google/generative-ai` and friends are installed). Re-run this any time you edit `packages/config/app/topics.yaml`.

Without the schema + seed, classification and the digest pipeline fail against an empty or wrong database.

## 3. Dev server

From the repo root:

```bash
pnpm dev
```

The web app is served on port **3000** (see `apps/web/package.json`).

## 4. Test the digest route

```bash
curl "http://localhost:3000/api/digest?secret=${CRON_SECRET}"
```

Use the same `CRON_SECRET` as in `.env`. This runs the full pipeline (fetch → embed → cluster → summarize → classify → upsert) and can take anywhere from under a minute to several minutes depending on cluster count and Flash pacing — see [`guides/digest-flow.md`](./guides/digest-flow.md) for a full walkthrough and timing reference.

Re-running on the same UTC day is a no-op:

```json
{ "status": "already-run-today" }
```

To force a fresh run, clear today's window first:

```bash
docker exec $(cd infra && docker compose ps -q postgres) \
  psql -U 2mintoday -d 2mintoday -c "delete from clusters where published_at >= date_trunc('day', now() at time zone 'utc');"
```

### Inspect ingestion only (no embeddings / pipeline)

Runs the same fetch as the digest but returns per-source stats and does not write to the database:

```bash
curl "http://localhost:3000/api/digest/sources?secret=${CRON_SECRET}"
```

Edit **`packages/config/app/news-sources.yaml`** to enable or disable RSS sources; restart dev if the loader was already cached.

## 5. Mock homepage (optional)

Set `USE_MOCK_DATA=true` in `apps/web/.env` to show static digest data without running the full pipeline. The client-side digest fetch (`GET /api/digest/data`) resolves this the same way regardless of mock mode — no separate code path to remember.

Set it back to `false` to load real rows from Postgres.

## 6. Bruno (API collection)

Open the workspace at **`.bruno/workspace.yml`** in [Bruno](https://www.usebruno.com/). Set the **Local** environment variable to match `apps/web/.env`:

- **`base_url`** — `http://localhost:3000` (default)
- **`cron_secret`** — same value as `CRON_SECRET`

The **2min.today** collection under **`.bruno/collections/2min.today/`** includes **Digest → Run pipeline** and **Digest → Fetch sources** (same routes as §4).
