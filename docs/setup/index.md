# Setup

Order for a full local + production stack. Each line links to the detailed guide.

From the **repository root**, you can:

- **Create `apps/web/.env` from the example** — run [`./tools/scripts/init-env.sh`](../../tools/scripts/init-env.sh) (copies `apps/web/.env.example` → `apps/web/.env`; exits if `.env` already exists).
- **Generate random secrets** — run [`./tools/scripts/gen-secret.sh`](../../tools/scripts/gen-secret.sh) (prints a URL-safe value and copies it to the clipboard when `pbcopy`, `xclip`, or `xsel` is available; optional argument `CRON_SECRET` or `BREAKING_SECRET` prints a paste-ready `KEY="..."` line).

<!-- 1 — Database, vectors, and public read model; apply before seeding anchors. -->

**Supabase** — project, keys, SQL migrations, bucket-anchor seed, RLS overview — [01-setup-supabase.md](./01-setup-supabase.md)

<!-- 2 — Required before bucket-anchor seed and any pipeline that embeds or summarizes. -->

**Gemini** — API key, models, quotas — [02-setup-gemini.md](./02-setup-gemini.md)

<!-- 3 — Optional for fetch if you disable or mock X; otherwise needed for live search. -->

**X (Twitter)** — bearer token and how the fetch query uses it — [03-setup-x-twitter.md](./03-setup-x-twitter.md)

<!-- 4 — After the app deploys; mirror .env and wire cron + secrets shared with GitHub. -->

**Vercel** — env vars, digest cron, secrets also used by Actions — [04-setup-vercel-env.md](./04-setup-vercel-env.md)

<!-- 5 — Depends on APP_URL and BREAKING_SECRET from the Vercel step. -->

**GitHub Actions** — breaking-news workflow and repository secrets — [05-setup-github-breaking.md](./05-setup-github-breaking.md)
