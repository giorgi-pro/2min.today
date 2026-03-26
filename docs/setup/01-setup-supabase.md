# 01-setup-supabase.md

**One-time Supabase setup for 2min.today (RFC-001 + ADR-002)**

## 1. Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → name `2min-today`
3. Choose region closest to you
4. Wait for database to be ready (~30 s)

## 2. Extract keys (copy to `apps/web/.env`)

- **SUPABASE_URL** → Project Settings → API → URL
- **SUPABASE_SERVICE_ROLE_KEY** → Project Settings → API → service_role key (never expose in client code)
- **PUBLIC_SUPABASE_URL** → same as `SUPABASE_URL`
- **PUBLIC_SUPABASE_ANON_KEY** → anon key

## 3. Run migrations

Migrations live in `apps/web/supabase/migrations/` (`001-pgvector.sql`, then `002-live-news.sql`). Apply them in order via the Supabase SQL editor, or with the [Supabase CLI](https://supabase.com/docs/guides/cli) after linking the project.

## 4. Seed bucket anchors (once)

Requires [02-setup-gemini.md](./02-setup-gemini.md) (`GEMINI_API_KEY`) and the Supabase variables above loaded in the environment.

From the **repository root**:

```bash
set -a && source apps/web/.env && set +a && pnpm exec tsx scripts/seed-bucket-anchors.ts
```

This upserts embedding rows in `bucket_anchors` from `apps/web/src/lib/config/buckets`.

## 5. RLS

Covered by the migrations: anon **SELECT** on `clusters` where appropriate (e.g. published rows). The pipeline uses the service role for read/write; no extra policies are required for that path.
