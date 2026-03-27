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

Seed bucket classification anchors (run from repo root):
```bash
pnpm --filter @2min.today/web run seed:anchors
```

There is no test framework. Manual API testing uses the Bruno collection in `.bruno/collections/2min.today/` (requires `base_url`, `cron_secret`, `breaking_secret` variables).

## Architecture

### Monorepo Structure

- **`apps/web`** — SvelteKit 5 app (main product). Both frontend and backend API routes live here.
- **`apps/docs`** — Next.js 16 + React 19 documentation site.
- **`packages/ui`** — Shared component library (`@2min.today/ui`). Currently has Svelte components (Header, Footer) and a React button stub. Imported via workspace alias.

### Backend Pipeline (`apps/web/src/routes/api/digest/+server.ts`)

The digest API is the core of the product. The 6-phase pipeline in `lib/pipeline/index.ts`:
1. **Fetch** — Parses RSS + X from `lib/config/news-sources.yaml` → `RawItem[]` (fetch-only diagnostics: `GET /api/digest/sources?secret=`)
2. **Embed** — Gemini embedding per story → `EmbeddedItem[]`
3. **Cluster** — Cosine similarity grouping → `Cluster[]` (threshold: `CLUSTER_SIMILARITY_THRESHOLD`, default 0.85)
4. **Summarize** — One Flash call per cluster → headline + 3 bullets + "Why it Matters" (optional cap: `DIGEST_SUMMARIZE_MAX_CLUSTERS`)
5. **Classify** — Compares centroid to bucket anchors in Supabase → assigns one of 10 buckets (threshold: `CLASSIFY_SIMILARITY_THRESHOLD`, default 0.65)
6. **Upsert** — Persists to Supabase `clusters` table

**Buckets** — 5 geographic: `usa`, `europe`, `middle-east`, `americas`, `world`; 5 topical: `business`, `tech`, `science`, `health`, `sports`. Legacy values are auto-normalized via `normalizeClusterBucket()`.

**Breaking news** — Separate pipeline at `lib/pipeline/breaking/` triggered by `POST /api/breaking`. Uses heuristic scoring (no embeddings), then one Flash call per candidate. Deduplicates via `source_url`. Workflow: `.github/workflows/breaking-news.yml` (manual dispatch only; cron commented out).

Protected by cron auth. Triggered by GitHub Actions (`.github/workflows/daily-digest.yml`) or Vercel cron.

Model constants are in `apps/web/src/lib/server/digest/models.ts`:
- `FLASH_MODEL`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION` — see `apps/web/.env.example` (defaults in `lib/server/digest/models.ts` getters)
- `FLASH_GENERATION_MIN_INTERVAL_MS` — optional; unset = **UnconstrainedFlow** (no pacing, no 429 retries); set to e.g. `15000` = **ConstrainedFlow** (one Flash call every 15s + 429 retries with backoff)

Local dev: set `USE_MOCK_DATA=true` in `apps/web/.env` to bypass Supabase and return static mock digest on the homepage.

**Database** — Migrations in `apps/web/supabase/migrations/`. Tables: `clusters` (stores digests with HNSW pgvector index) and `bucket_anchors` (classification seed vectors). Run `seed:anchors` script after adding new buckets to `lib/config/buckets.yaml`.

### Tech Stack Decisions (from ADR)

- **SvelteKit** over separate frontend/backend: single repo, single language, zero boundary
- **Gemini** (not OpenAI): free tier sufficient for this workload
- **Supabase + pgvector**: native cosine similarity, free tier
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
