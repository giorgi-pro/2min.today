# RFC-005: Breaking News Pipeline

**Status:** Approved for Implementation
**Date:** 2026-03-26
**Author:** Project Owner
**Depends on:** RFC-001 (Daily Digest Pipeline)
**Target files:**
- `apps/web/src/routes/api/breaking/+server.ts` — entry point (GET handler)
- `apps/web/src/lib/pipeline/breaking/index.ts` — barrel
- `apps/web/src/lib/pipeline/breaking/score.ts` — heuristic scorer
- `apps/web/src/lib/pipeline/breaking/generate.ts` — Flash card generator
- `apps/web/src/lib/pipeline/breaking/upsert.ts` — Supabase write
- `apps/web/src/lib/types/breaking.ts` — TypeScript interfaces
- `apps/web/supabase/migrations/002-live-news.sql` — schema
- `.github/workflows/breaking-news.yml` — GitHub Actions cron (every 15 min)

---

## Purpose

Run a lightweight breaking-news check every 15 minutes. When a headline scores above the breaking threshold, generate a compact card (headline + 2 bullets) with a single Gemini Flash call and publish it immediately. Mundane stories are ignored until the nightly full pipeline (RFC-001).

**Cost target: $0.** No embeddings. No clustering. One Flash call per confirmed breaking story, at most a handful per day.

---

## Exact Behaviour Rules

1. Runs every **15 minutes** via GitHub Actions scheduled workflow (`.github/workflows/breaking-news.yml`).
2. Fetches only items published in the **last 20 minutes** (prevents reprocessing stale headlines).
3. Scores headlines with **heuristics only** — zero AI calls for scoring.
4. For each headline that passes the threshold, checks Supabase for an existing row with the same `source_url`. If one exists, skips it.
5. Generates a live card with **one** `gemini-1.5-flash` call per story (headline + 2 bullets).
6. Persists as a row in the `clusters` table with `is_live = true` and no `bucket` — same table as the nightly digest.
7. The nightly pipeline (RFC-001) is unaffected — its idempotency check only skips rows where `is_live = false` for today's UTC window.
8. Live cards appear **mixed into their relevant category row** on the homepage, visually distinguished by an inset gray panel (headline + bullets only) on the same white tile as regular cards, plus a `LIVE` label. Tags sit outside that panel, matching regular cards. No "Why it Matters".

---

## Architecture Overview

```
GitHub Actions (every 15 min)
  └── GET /api/breaking?secret=BREAKING_SECRET
        └── breaking/index.ts
              ├── fetch.ts (shared with RFC-001, reused as-is)
              │     └── filter to last 20 min
              ├── score.ts
              │     └── heuristic scoring — no AI
              ├── generate.ts
              │     └── one Flash call per story that passes threshold
              └── upsert.ts
                    └── skip if URL already persisted today
```

---

## 1. Database Schema (`supabase/migrations/002-live-news.sql`)

Adds `is_live` and `source_url` columns to the existing `clusters` table. No new table — live breaking stories are regular clusters with `is_live = true`.

```sql
alter table clusters
  add column if not exists is_live    boolean      not null default false,
  add column if not exists source_url text;
```

`source_url` stores the original RSS item URL for deduplication (checked before generating a live card). The existence check is a fast index scan on `source_url`.

```sql
create index if not exists idx_clusters_source_url on clusters (source_url)
  where source_url is not null;
```

---

## 2. Types (`lib/types/breaking.ts`)

```ts
export interface BreakingCandidate {
  url: string;
  title: string;
  source: string;
  published: Date;
  score: number;
}
```

`DigestCard` in `+page.server.ts` gains `isLive: boolean`. `BreakingStory` as a separate interface is not needed — live stories are `DigestCard` rows with `isLive: true`.

---

## 3. Heuristic Scorer (`lib/pipeline/breaking/score.ts`)

No AI. Each signal adds points to a score. Items that reach `BREAKING_THRESHOLD` become candidates.

### Constants

```ts
const BREAKING_THRESHOLD = 3;
const MAX_AGE_MINUTES = 20;
```

### Signal weights

| Signal | Points |
|--------|--------|
| Title prefix matches `BREAKING`, `URGENT`, `FLASH`, `ALERT` (case-insensitive) | +5 |
| Title contains `breaking news` or `just in` | +3 |
| Title contains `killed`, `dead`, `deaths`, `explosion`, `attack`, `crash` | +2 |
| Title contains `earthquake`, `tsunami`, `hurricane`, `tornado` | +2 |
| Title contains `resign`, `fired`, `arrested`, `indicted`, `charged` | +2 |
| Title contains `war`, `invasion`, `sanctions`, `ceasefire` | +2 |
| Title contains `emergency`, `evacuation`, `shutdown` | +1 |
| Published within the last 5 minutes | +1 |
| Source is Reuters or AP News | +1 |

### Full TypeScript

```ts
import type { RawItem } from '$lib/types/digest';
import type { BreakingCandidate } from '$lib/types/breaking';

const BREAKING_THRESHOLD = 3;
const MAX_AGE_MINUTES = 20;

const SCORE_MAP: Array<{ pattern: RegExp; points: number }> = [
  { pattern: /^(breaking|urgent|flash|alert)[:\s]/i,               points: 5 },
  { pattern: /\b(breaking news|just in)\b/i,                       points: 3 },
  { pattern: /\b(killed|dead|deaths|explosion|attack|crash)\b/i,   points: 2 },
  { pattern: /\b(earthquake|tsunami|hurricane|tornado)\b/i,        points: 2 },
  { pattern: /\b(resign(ed)?|fired|arrested|indicted|charged)\b/i, points: 2 },
  { pattern: /\b(war|invasion|sanctions|ceasefire)\b/i,            points: 2 },
  { pattern: /\b(emergency|evacuation|shutdown)\b/i,               points: 1 },
];

const TRUSTED_SOURCES = new Set(['Reuters', 'AP News', 'Associated Press']);

export function scoreItems(items: RawItem[]): BreakingCandidate[] {
  const now = Date.now();
  const cutoff = new Date(now - MAX_AGE_MINUTES * 60 * 1000);

  return items
    .filter(item => item.published >= cutoff)
    .map(item => {
      let score = 0;
      for (const { pattern, points } of SCORE_MAP) {
        if (pattern.test(item.title)) score += points;
      }
      if (now - item.published.getTime() < 5 * 60 * 1000) score += 1;
      if (TRUSTED_SOURCES.has(item.source)) score += 1;
      return { url: item.url, title: item.title, source: item.source, published: item.published, score };
    })
    .filter(c => c.score >= BREAKING_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}
```

---

## 4. Card Generator (`lib/pipeline/breaking/generate.ts`)

One Flash call per story. Produces a two-bullet card — deliberately shorter than the nightly digest's three-bullet summary to signal it's a raw, early report.

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import type { BreakingCandidate } from '$lib/types/breaking';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
      },
      required: ['headline', 'bullets'],
    },
  },
});

const BREAKING_PROMPT = (title: string) =>
  `You are a wire editor writing a breaking news flash for 2min.today.

Raw headline: "${title}"

Return ONLY valid JSON:
{
  "headline": "max 10 words, present tense, factual",
  "bullets": ["exactly 2 bullets, max 20 words each, confirmed facts only"]
}

Tone: urgent, zero speculation, no padding.`;

export async function generateBreakingCard(
  candidate: BreakingCandidate,
): Promise<{ headline: string; bullets: [string, string] }> {
  const result = await model.generateContent(BREAKING_PROMPT(candidate.title));
  const parsed = JSON.parse(result.response.text()) as {
    headline: string;
    bullets: [string, string];
  };
  return parsed;
}
```

---

## 5. Upsert (`lib/pipeline/breaking/upsert.ts`)

Checks for duplicate by `source_url` before writing. Inserts into `clusters` with `is_live = true`. Returns `true` if inserted, `false` if already exists (skips silently).

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BreakingCandidate } from '$lib/types/breaking';

export async function upsertLiveStory(
  supabase: SupabaseClient,
  candidate: BreakingCandidate,
  card: { headline: string; bullets: [string, string] },
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .eq('source_url', candidate.url)
    .limit(1);

  if (existing?.length) return false;

  await supabase.from('clusters').insert({
    source_url: candidate.url,
    is_live: true,
    bucket: null,
    summary: {
      headline: card.headline,
      bullets: card.bullets,
      why_it_matters: '',
    },
    published_at: candidate.published.toISOString(),
  });

  return true;
}
```

---

## 6. Pipeline Barrel (`lib/pipeline/breaking/index.ts`)

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchRawItems } from '../fetch';
import { scoreItems } from './score';
import { generateBreakingCard } from './generate';
import { upsertBreakingStory } from './upsert';

export const breakingPipeline = {
  async run(supabase: SupabaseClient): Promise<number> {
    const rawItems = await fetchRawItems();
    const candidates = scoreItems(rawItems);

    let published = 0;
    for (const candidate of candidates) {
      const card = await generateBreakingCard(candidate);
      const inserted = await upsertLiveStory(supabase, candidate, card);
      if (inserted) published++;
    }

    return published;
  },
};
```

---

## 7. Entry Point (`routes/api/breaking/+server.ts`)

Guarded by a separate `BREAKING_SECRET` env var (distinct from `CRON_SECRET` to limit blast radius if either leaks).

```ts
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/server';
import { breakingPipeline } from '$lib/pipeline/breaking';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async ({ url }: RequestEvent) => {
  if (url.searchParams.get('secret') !== env.BREAKING_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const published = await breakingPipeline.run(supabase);
  return json({ status: 'ok', published });
};
```

Add `BREAKING_SECRET` to `apps/web/.env.example` and Vercel environment variables.

---

## 8. GitHub Actions Workflow (`.github/workflows/breaking-news.yml`)

GitHub Actions is the trigger — Vercel's free tier does not support sub-hourly cron. The workflow simply calls the endpoint; all logic lives in the SvelteKit app.

```yaml
name: Breaking News Check

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Ping breaking news endpoint
        run: |
          curl -sf "${{ secrets.APP_URL }}/api/breaking?secret=${{ secrets.BREAKING_SECRET }}" \
            -o /dev/null \
            --max-time 30
```

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `APP_URL` | Your Vercel deployment URL, e.g. `https://2min.today` |
| `BREAKING_SECRET` | Same value as `BREAKING_SECRET` in Vercel env vars |

GitHub Actions free tier: public repos get unlimited minutes; private repos get 2,000 min/month. Each run takes < 5 seconds → 2,880 runs/month × 5 s = ~4 minutes/month. Effectively $0.

---

## 9. UI: Live Card Treatment

Live breaking cards are mixed **directly into their relevant category rows** alongside regular digest cards. No separate strip or table — they are rows in the `clusters` table with `is_live: true`, rendered by the same `NewsCard` component with a distinct visual treatment.

### Visual Language

- **Card shell:** Same white tile and outer `p-2` padding as a regular digest card (`bg-white` on the tile root for live rows).
- **Live content inset:** Headline and bullets only sit inside a nested panel: `bg-[#F0F2F4]`, `border border-black/15`, inner `p-2`, inset from the tile edge by the tile’s own padding (so a white margin frames the panel).
- **Label:** `LIVE` in bold Slate mono uppercase (`#637588`), replacing the normal source label position — **outside** the gray inset, in the white header strip.
- **Source control (`©`):** Slate/60 opacity when live, unchanged position.
- **Bullet markers:** Slate square instead of black (inside the inset only).
- **Tags:** Rendered **below** the inset with the same `NewsTags` treatment as ordinary cards (not inside the gray panel).
- **No "Why it Matters"** — two bullets only; the absence signals it's an unfinished story.
- **`isBreaking`** (editorial flag, separate concern) renders a pulsing Tomato dot and is unaffected by `isLive`.

### Data shape

The pipeline writes live stories into the existing `clusters` table with an additional `is_live` boolean column (migration in §1). The homepage `+page.server.ts` reads it the same way as regular clusters and maps it to `isLive: boolean` on `DigestCard`. No separate query or table.

### `+page.server.ts` mapping

```ts
isLive: row.is_live ?? false,
```

### `NewsCard` prop

`isLive` is a boolean prop on `NewsCard`. When true, the card uses a white shell with a bordered gray inset for headline + bullets only, slate `LIVE` label and `©` styling, and omits the "Why it Matters" section; tags stay on the white footer like regular cards. `isBreaking` remains independent (pulsing dot only).

---

## 10. Error Handling

- RSS fetch fails → log, return `{ status: 'ok', published: 0 }` (non-fatal; next run in 15 min)
- Flash call fails for a candidate → log and skip that candidate; continue with the rest
- Supabase write fails → log and skip; idempotency means the story will be caught if it scores again in a future run (unlikely for breaking news, acceptable)
- GitHub Actions step fails → workflow exits non-zero, GitHub notifies via the default failure email

---

## 11. One-Time Setup

1. Run migration `002-live-news.sql` (adds `is_live` + `source_url` columns to `clusters`).
2. Add `BREAKING_SECRET` to `apps/web/.env.example`, `.env.local`, and Vercel dashboard.
3. Add `APP_URL` and `BREAKING_SECRET` to GitHub repository secrets (Settings → Secrets → Actions).
4. No new RLS policy needed — live stories are in `clusters`, which already has anonymous `SELECT` access.
5. Enable the GitHub Actions workflow (merge to main; it activates on push if `on: schedule` is present).

---

## 12. What This Is Not

- **Not a real-time WebSocket feed.** Stories appear on the next page load. SSR is sufficient.
- **Not replacing the nightly digest.** Breaking cards are a supplement, not a substitute.
- **Not AI-scored.** The heuristic is intentionally simple. False positives on mundane stories are acceptable — the cost of one wasted Flash call is negligible. False negatives on breaking stories with unusual phrasing are also acceptable.

---

## References

- RFC-001 (Daily Digest Pipeline) — `fetch.ts` is reused as-is
- Gemini Node SDK — `gemini-1.5-flash` structured JSON output
- GitHub Actions cron syntax
- Supabase JS v2 — `.insert()`, `.select()`, `.eq()`
