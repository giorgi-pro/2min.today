# Development

Local workflow and smoke-testing the API routes. One-time environment variables and services are covered in [Setup](./setup/index.md).

## 1. Clone and install

```bash
git clone <repo-url>
cd 2min_today
pnpm install
cp apps/web/.env.example apps/web/.env
```

Fill `apps/web/.env` using the [setup guides](./setup/index.md). For anything that touches the database you need at least **Supabase** URL + service role + anon/public keys and **Gemini** (`GEMINI_API_KEY`) before seeding anchors.

## 2. Database (Supabase)

Full dashboard steps: [01-setup-supabase.md](./setup/01-setup-supabase.md).

1. **Project** — Create a Supabase project and copy `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_SUPABASE_URL`, and `PUBLIC_SUPABASE_ANON_KEY` into `apps/web/.env`.

2. **Migrations** — SQL files live under `apps/web/supabase/migrations/`. Apply **in order**:
   - `001-pgvector.sql` — `vector` extension, `clusters`, `bucket_anchors`, indexes
   - `002-live-news.sql` — breaking-news columns on `clusters` (`is_live`, `source_url`, …)
   - `003-lowercase-buckets-world-region.sql` — lowercase `bucket` slugs (`world` … `health`, `emerging`); `summary.region` `global` → `world`; relax `bucket_anchors` check then re-apply

   Use the Supabase **SQL Editor** (paste and run each file), or the [Supabase CLI](https://supabase.com/docs/guides/cli) (`db push` / linked project) if you use it locally.

3. **Seed bucket anchors (once per database)** — After migrations, ensure `apps/web/.env` has `GEMINI_API_KEY` and Supabase vars. The script loads that file via `dotenv` when the working directory is `apps/web`.

```bash
pnpm --filter @2min.today/web run seed:anchors
```

Run from the **repository root**. This uses `apps/web`’s `node_modules` (where `@google/generative-ai` and friends are installed) and the correct cwd for `buckets.yaml` resolution. A plain `pnpm exec tsx scripts/seed-bucket-anchors.ts` at the repo root fails module resolution because those packages are not root dependencies.

Without migrations + seed, classification and the digest pipeline will fail against an empty or wrong schema.

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

Use the same `CRON_SECRET` as in `.env`.

### Inspect ingestion only (no embeddings / pipeline)

Runs the same fetch as the digest but returns per-source stats and does not write to the database:

```bash
curl "http://localhost:3000/api/digest/sources?secret=${CRON_SECRET}"
```

Edit **`apps/web/src/lib/config/news-sources.yaml`** to enable or disable RSS/X sources; restart dev if the loader was already cached.

## 5. Test the breaking route

```bash
curl "http://localhost:3000/api/breaking?secret=${BREAKING_SECRET}"
```

## 6. Mock homepage (optional)

Set `USE_MOCK_DATA=true` in `apps/web/.env` to show static digest data without running the full pipeline.

After a successful digest run, the homepage can load real rows from Supabase via the anon client.

## 7. Bruno (API collection)

Open the workspace at **`.bruno/workspace.yml`** in [Bruno](https://www.usebruno.com/). Set the **Local** environment variables to match `apps/web/.env`:

- **`base_url`** — `http://localhost:3000` (default)
- **`cron_secret`** — same value as `CRON_SECRET`
- **`breaking_secret`** — same value as `BREAKING_SECRET`

The **2min.today** collection under **`.bruno/collections/2min.today/`** includes **Digest → Run pipeline**, **Digest → Fetch sources**, and **Breaking → Run pipeline** (same routes as §4–§5).
