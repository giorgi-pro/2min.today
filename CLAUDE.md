# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**2min.today** is an AI-powered daily global news digest. It ingests RSS feeds, deduplicates stories via vector similarity, and synthesizes them into a two-minute read using Gemini AI.

## Commands

All commands run from the repo root using pnpm + Turborepo:

```bash
pnpm dev          # Run all apps in dev mode (web: :3000, docs: :3001)
pnpm build        # Build all apps/packages
pnpm lint         # Lint all workspaces (Biome)
pnpm check-types  # Type-check all workspaces
pnpm format       # Format with Prettier (*.ts, *.tsx, *.md)
```

To run a single app:

```bash
pnpm turbo dev --filter=web
pnpm turbo dev --filter=docs
pnpm turbo build --filter=web
```

Type-check the SvelteKit app specifically:

```bash
cd apps/web && pnpm check-types   # runs svelte-check
```

Local Postgres (Docker) + schema + seed:

```bash
cd infra && docker compose up -d              # start pgvector Postgres on :5432
pnpm --filter @2min.today/web run db:setup    # apply packages/data/schema.sql (existing volume)
pnpm --filter @2min.today/web run seed:anchors # seed bucket classification anchors
```

`DATABASE_URL` (in `apps/web/.env`) points at that DB. A fresh Docker volume applies the schema automatically; `db:setup` is for an already-initialized volume.

There is no test framework. Manual API testing uses the Bruno collection in `.bruno/collections/2min.today/` (requires `base_url`, `cron_secret` variables).

## Architecture

### Monorepo Structure

- **`apps/web`** — SvelteKit 5 app. Frontend routes + thin API handlers that delegate to `@services`.
- **`apps/docs`** — Next.js 16 + React 19 documentation site.
- **`packages/lib`** (`@lib`) — Core pipeline logic: `src/pipeline/` (digest pipeline), `src/search/`, `src/server/digest/` (Gemini model helpers).
- **`packages/services`** (`@services`) — Orchestration layer. Route handlers call `runDigestCron`, `loadHomePageDigest`, etc. from here.
- **`packages/config`** (`@config`) — Env validation (`env/index.ts` via `@t3-oss/env-core` + zod), RSS sources (`app/news-sources.yaml`, RSS only), topic anchor definitions (`app/topics.yaml`).
- **`packages/data`** (`@data`) — Postgres access. `db.ts` exports `getDb()` (a `pg` connection pool from `DATABASE_URL`) and the `Db` type. Schema in `schema.sql` (source of truth); `db-setup` applies it.
- **`packages/types`** (`@types`) — Shared TypeScript types (digest, topics, homepage, search, etc.).
- **`packages/utils`** (`@utils`) — Pure utilities: `category-order`, `digest-filter`, `mock-data`, etc.
- **`packages/logging`** (`@logging`) — Pino logger singleton.
- **`packages/ui`** (`@ui`) — Svelte 5 component library: shell layouts (`DesktopLayout`, `MobileLayout`), digest components (`CategoryRow`, `CategoryPanel`, `NewsCard`, `MobileView`), `Header`, `Footer`, `Menu`, `GlobalSearch`, region switches, and CSS modules (`styles/`).

Path aliases are defined in `apps/web/svelte.config.js` and resolve to the packages above.

### Backend Pipeline

The digest API handler is at `apps/web/src/routes/api/digest/+server.ts`. It calls `runDigestCron` from `@services`, which runs the 6-phase pipeline in `packages/lib/src/pipeline/index.ts`:

1. **Fetch** — Parses RSS from `packages/config/app/news-sources.yaml` → `RawItem[]` (fetch-only diagnostics: `GET /api/digest/sources?secret=`)
2. **Embed** — Gemini embedding per story → `EmbeddedItem[]`
3. **Cluster** — Cosine similarity grouping → `Cluster[]` (threshold: `CLUSTER_SIMILARITY_THRESHOLD`, default 0.85)
4. **Summarize** — One Flash call per cluster → headline + 3 bullets + "Why it Matters" + region + topic
5. **Classify** — Compares centroid to topic anchors in Postgres → assigns one of 8 topics (threshold: `CLASSIFY_SIMILARITY_THRESHOLD`, default 0.65); region comes from the LLM call in step 4
6. **Upsert** — Persists to the Postgres `clusters` table

**Region and topic are independent axes** on each cluster — region is where a story happened, topic is what it's about. Region (7): `usa`, `europe`, `middle-east`, `americas`, `asia`, `africa`, `world`. Topic (8): `politics`, `conflict`, `business`, `tech`, `science`, `health`, `environment`, `society`. Homepage rows are topics; region is a header filter. Some RSS sources in `news-sources.yaml` set a `region` hint that overrides the LLM's region guess for stories from that feed.

Protected by cron auth. Triggered by GitHub Actions (`.github/workflows/daily-digest.yml`) or Vercel cron.

Model constants are in `packages/lib/src/server/digest/models.ts`:

- `FLASH_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION` — defaults in model getters; override via env
- `FLASH_GENERATION_MIN_INTERVAL_MS` — optional; unset = **UnconstrainedFlow** (no pacing, no 429 retries); set to e.g. `15000` = **ConstrainedFlow** (one Flash call every 15s + 429 retries with backoff)

Local dev: set `USE_MOCK_DATA=true` in `apps/web/.env` to bypass Postgres and return static mock digest on the homepage.

**Database** — Plain Postgres with the `pgvector` extension, reached via `pg` (no ORM). Schema lives in `packages/data/schema.sql`. Tables: `clusters` (stores digests with region + topic columns and an HNSW pgvector index) and `topic_anchors` (classification seed vectors). Local dev DB runs via Docker Compose in `infra/` (`pgvector/pgvector:pg16`); a fresh volume auto-applies the schema, and `pnpm --filter @2min.today/web run db:setup` applies it to an existing DB. Run `seed:anchors` after adding new topics to `packages/config/app/topics.yaml`.

### Environment Variables

All env vars are validated at startup via `packages/config/env/index.ts`. Required server-side vars: `GEMINI_API_KEY`, `DATABASE_URL` (standard libpq connection string), `CRON_SECRET`, `FLASH_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION`. No client-side vars are currently required.

### Tech Stack Decisions (from ADR)

- **SvelteKit** over separate frontend/backend: single repo, single language, zero boundary
- **Gemini** (not OpenAI): free tier sufficient for this workload
- **Postgres + pgvector** (via `pg`, no ORM): native cosine similarity; local dev runs it in Docker (`infra/`)
- **Vercel**: free tier, native cron support for edge functions
- **Python/Go rejected**: unnecessary context switch for a solo TypeScript project

### Tooling

- **Biome 2.1.1** for linting/formatting (not ESLint). Config in `biome.json` (root) and per-package `biome.json`.
  - Line width: 120, indent: 2 spaces, single quotes, no trailing arrow parens
  - `noExplicitAny` is suspended (allowed)
  - a11y rules `useMediaCaption` and `noSvgWithoutTitle` are disabled
- **Prettier** is only used at the root level for `.ts/.tsx/.md` files (not Svelte files)
- **Turborepo** orchestrates tasks; `build` depends on `^build` (packages built first)

## Design System

The design language is **"High-End Editorial Brutalism"** (codename: "The Digital Ledger"). Key rules enforced in `tailwind.config.ts` and `apps/web/DESIGN.md`:

- **No rounded corners** — `border-radius: 0` everywhere (buttons, cards, inputs)
- **No box shadows** — elevation via tonal background layering only
- **No 1px borders** — boundaries defined by background color shifts; use "Ghost Border" (15% opacity) only as last resort
- **Typography:** Inter font throughout; labels uppercase with `letter-spacing: 0.1em`; display headlines at `-0.03em` tracking
- **Spacing:** all multiples of `0.7rem`
- **Brand colors:** Tomato `#FF6347` (primary), Teal `#0F7A91` (secondary), Slate `#637588` (tertiary)
- **Surface hierarchy:** 5 levels from `#FFFFFF` → `#C8D1D8`
- **Max-width:** `2xl` container for editorial ledger feel
