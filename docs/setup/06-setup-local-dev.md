# 06-setup-local-dev.md

**Local development and smoke-testing the API routes**

## 1. Clone and install

```bash
git clone <repo-url>
cd 2min_today
pnpm install
cp apps/web/.env.example apps/web/.env
```

Fill `apps/web/.env` using the linked setup guides.

## 2. Dev server

From the repo root:

```bash
pnpm dev
```

The web app is served on port **3000** (see `apps/web/package.json`).

## 3. Test the digest route

```bash
curl "http://localhost:3000/api/digest?secret=${CRON_SECRET}"
```

Use the same `CRON_SECRET` as in `.env`.

## 4. Test the breaking route

```bash
curl "http://localhost:3000/api/breaking?secret=${BREAKING_SECRET}"
```

## 5. Mock homepage (optional)

Set `USE_MOCK_DATA=true` in `apps/web/.env` to show static digest data without running the full pipeline.

After a successful digest run, the homepage can load real rows from Supabase via the anon client.
