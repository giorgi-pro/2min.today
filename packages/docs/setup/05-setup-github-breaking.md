# 05-setup-github-breaking.md

**GitHub Actions: ~15-minute breaking news check**

## 1. Workflow file

The workflow is already in the repo: `.github/workflows/breaking-news.yml`.

## 2. Repository secrets

**Settings** → **Secrets and variables** → **Actions**:

- `APP_URL` — your deployed site origin (for example `https://your-app.vercel.app`)
- `BREAKING_SECRET` — must match Vercel’s `BREAKING_SECRET` exactly

## 3. Behavior

- Runs on a schedule (every 15 minutes) and supports `workflow_dispatch`
- `curl` to `/api/breaking?secret=...`
- Scoring + Gemini Flash write live-style rows into `clusters` (see RFC-005)

Public repositories get generous Actions minutes; cost is essentially the Gemini/API usage from those calls.

## 4. Enable

Merge the workflow to the default branch; it activates automatically.
