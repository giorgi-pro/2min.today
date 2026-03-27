# 04-setup-vercel-env.md

**Production environment on Vercel (mirror `apps/web/.env`)**

## 1. Dashboard

Vercel project → **Settings** → **Environment Variables**

## 2. Add for Production and Preview

Align names and values with `apps/web/.env.example`:

- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_SUPABASE_URL`
- `X_BEARER_TOKEN`
- `CRON_SECRET`
- `BREAKING_SECRET`
- `USE_MOCK_DATA` → `false`
- `DIGEST_FUSE_THRESHOLD` → `0.4` (or omit to use the app default)

Generate `CRON_SECRET` and `BREAKING_SECRET` with the same process you use locally (for example `tools/scripts/gen-secret.sh`).

## 3. Daily digest cron

Configure a **Cron Job** in the Vercel project so production calls the digest route once per day with your cron secret (query or header, whichever your deployed route expects). Example schedule: `0 0 * * *` (UTC). Path: `/api/digest`.

If you use `vercel.json` `crons`, the shape is along the lines of:

```json
{
  "crons": [{ "path": "/api/digest", "schedule": "0 0 * * *" }]
}
```

Adjust to match your adapter and auth scheme.

## 4. GitHub Actions (breaking news)

Repository **Settings** → **Secrets and variables** → **Actions**:

- `APP_URL` — production base URL (for example `https://2min.today`)
- `BREAKING_SECRET` — same value as `BREAKING_SECRET` on Vercel

See [05-setup-github-breaking.md](./05-setup-github-breaking.md) for the workflow details.
