# RFC-001: Daily Digest Pipeline

**Status:** Approved for Implementation
**Date:** 2026-03-25
**Author:** Grok (detailed spec) / Project Owner
**Target files:** `/src/routes/api/digest/+server.ts` + `/src/lib/pipeline/*` + `/scripts/seed-bucket-anchors.ts` + `/src/routes/+page.server.ts` + `/src/lib/supabase/client.ts`

## Purpose

This RFC is written so any LLM (or developer) can **copy-paste and implement** the entire pipeline with zero ambiguity.
Every function, every prompt, every error path, every Supabase query is specified exactly.
The pipeline must always produce **exactly one daily edition** at 00:00 UTC, zero duplicates, perfect 5-bucket classification, and zero images.

## Exact Behaviour Rules

1. Runs **once per day** (Vercel Cron at `0 0 * * *` UTC).
2. Is **fully idempotent**: if re-run on the same day, it does nothing (checks `published_at` date).
3. End-to-end latency target: **< 2 seconds** on free tier.
4. Output: exactly one row per cluster in the `clusters` table.
5. Classification: **only** the 5 fixed buckets or `Emerging`.
6. No images, no HTML, no extra fields.

### Embedding vector size (Gemini + pgvector)

- **Schema:** `clusters.embedding` and `bucket_anchors.embedding` use **`vector(768)`** in `apps/web/supabase/migrations/001-pgvector.sql`. Every stored vector must be exactly **768** floats or Postgres/pgvector rejects the write.
- **API default:** `gemini-embedding-2-preview` returns **3072** dimensions unless configured otherwise.
- **Implementation:** all `embedContent` calls ( **`embed.ts`** and **`scripts/seed-bucket-anchors.ts`** ) set the Gemini request field **`outputDimensionality: 768`** (constant **`EMBEDDING_DIMENSION`** in `lib/server/digest/models.ts`), which the API documents as a supported reduced size (truncation from the end for supported models).
- **Why not 3072 in the DB:** at this product’s volume, **768** reduces storage, HNSW index size, and per-query cosine work versus **3072**, with quality that remains sufficient for deduplication and bucket routing. Adopting full **3072** would require a migration to `vector(3072)`, re-seeding `bucket_anchors`, and re-embedding or invalidating existing `clusters` rows.

## File Layout

```
/
├── scripts/
│   └── seed-bucket-anchors.ts               ← one-time seed script (run once after migration)
└── src/
    ├── routes/+page.server.ts                ← SSR `load`: today's clusters → grouped digest (no client fetch)
    ├── routes/api/digest/+server.ts          ← entry point (GET handler)
    ├── lib/supabase/server.ts                ← server-only Supabase client (service role; pipeline + cron)
    ├── lib/supabase/client.ts                ← anon + public URL (homepage `load`; same module is browser-safe if needed later)
    ├── lib/config/
    │   ├── buckets.yaml  ← single source of truth for bucket names + anchor text
    │   └── buckets.ts    ← YAML loader; exports BUCKET_ANCHORS + Bucket type
    ├── lib/pipeline/
    │   ├── index.ts      ← wires all steps into pipeline.run(supabase)
    │   ├── fetch.ts      ← returns RawItem[]
    │   ├── embed.ts      ← returns EmbeddedItem[]
    │   ├── cluster.ts    ← returns Cluster[]
    │   ├── summarize.ts  ← returns SummarizedCluster[]
    │   ├── classify.ts   ← returns ClassifiedCluster[]
    │   └── upsert.ts     ← writes to Supabase, returns ClassifiedCluster[]
    ├── lib/types/digest.ts                   ← all TypeScript interfaces
    └── supabase/migrations/001-pgvector.sql
```

## 1. Supabase Client (`lib/supabase/server.ts`)

Server-only module — never imported by any browser-side code.
Uses the **service role key** (bypasses RLS, required for cron writes).
Passed down to pipeline modules via dependency injection — no module imports the client globally.

```ts
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private'; // SvelteKit v2+ private env

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }, // no cookies needed for cron
  }
);
```

**Environment variables** — see `apps/web/.env.example` (and repo root `.env.example` if used for shared secrets). Private pipeline vars use SvelteKit `$env/dynamic/private`. Public Supabase URL + anon key for the homepage use `$env/dynamic/public` (§9). Set the same keys in Vercel → Environment Variables for production.

> Public reads use **`PUBLIC_SUPABASE_URL`** + **`PUBLIC_SUPABASE_ANON_KEY`** via `lib/supabase/client.ts` (see §9). Those variables are safe to expose to the browser; the cron pipeline uses **only** `server.ts` and must never import the anon client.

> RSS feed URLs are hardcoded inside `lib/pipeline/fetch.ts` — they are static, public, and never change. Putting them in env would add noise with no benefit.

## 2. Types (`lib/types/digest.ts`)

```ts
import type { Bucket } from '$lib/config/buckets';

export interface RawItem {
  id: string;
  title: string;
  /** Body text passed to embed + summarize. Often short for classic RSS (`<description>` teaser ~150–250 chars); longer when the feed publishes full HTML fields (see `fetch.ts`). */
  content: string;
  source: string;
  url: string;
  published: Date;
}

export interface EmbeddedItem extends RawItem {
  embedding: number[]; // 768-dim from gemini-embedding-2-preview
}

export interface Cluster {
  id: string;
  items: EmbeddedItem[];
  centroidEmbedding: number[];
}

export interface SummarizedCluster extends Cluster {
  headline: string;
  bullets: string[]; // exactly 3
  whyItMatters: string;
}

export interface ClassifiedCluster extends SummarizedCluster {
  bucket: Bucket;
  categoryLine: string | null; // only for Emerging
}
```

## 3. Bucket Config (`lib/config/buckets.yaml` + `lib/config/buckets.ts`)

Names and anchor phrases are **shared with the frontend** (digest sections: World, Business, Tech, Science, Health). The pipeline must not use alternate labels (e.g. Economy vs Business) unless the YAML and UI change together.

The YAML file is the long-term hook for **optional user-chosen topics** or **more than five sections**; only the loader, migration `check` constraint, seed script, and UI need to stay in sync when that changes.

### `lib/config/buckets.yaml`

Single source of truth for bucket names and anchor text.
Used by `classify.ts` and `scripts/seed-bucket-anchors.ts` — both import from `buckets.ts`, never from the YAML directly.

```yaml
# 2min.today Core Buckets
# Single source of truth — edit here; seed + classify consume via buckets.ts
# Future: user-defined topics or extra sections can start from this file
buckets:
  World:    "global geopolitics international relations diplomacy conflicts treaties"
  Business: "financial markets economy business corporate earnings monetary policy"
  Tech:     "technology innovation AI hardware software digital breakthroughs"
  Science:  "scientific discoveries research physics biology space exploration"
  Health:   "health medicine public health biomedical research wellness"
```

### `lib/config/buckets.ts`

Add **`yaml`** as a normal dependency in `apps/web` (order of **~4 KB gzipped**). It is **installed once** with the app; `parse()` runs **only when this module is first evaluated**, after which `BUCKET_ANCHORS` is a plain object and the rest of the pipeline gets **full TypeScript** inference and checking — **no YAML parsing per cluster, per request, or in a loop**.

```ts
import { parse } from 'yaml';
import fs from 'fs';
import path from 'path';

const raw = fs.readFileSync(path.join(process.cwd(), 'src/lib/config/buckets.yaml'), 'utf8');
export const BUCKET_ANCHORS = parse(raw).buckets as Record<string, string>;
export type Bucket = 'World' | 'Business' | 'Tech' | 'Science' | 'Health' | 'Emerging';
```

`Emerging` is a runtime classification outcome only; it is not a row in `buckets.yaml` and is not stored in `bucket_anchors`.

> The seed script uses `process.env` directly (not `$env/dynamic/private`) because it runs outside SvelteKit, as a plain Node script via `tsx`.

## 4. Pipeline Barrel (`lib/pipeline/index.ts`)

Glue layer that wires all steps in order and exports `pipeline.run(supabase)`.
The Supabase client is passed down to every step that needs DB access — no step imports it globally.

```ts
import { fetchRawItems } from './fetch';
import { embedItems } from './embed';
import { clusterItems } from './cluster';
import { summarizeClusters } from './summarize';
import { classifyClusters } from './classify';
import { upsertClusters } from './upsert';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassifiedCluster } from '../types/digest';

export const pipeline = {
  async run(supabase: SupabaseClient): Promise<ClassifiedCluster[]> {
    const rawItems    = await fetchRawItems();
    const embedded    = await embedItems(rawItems);
    const clusters    = await clusterItems(embedded, supabase);
    const summarized  = await summarizeClusters(clusters);
    const classified  = await classifyClusters(summarized, supabase);
    return upsertClusters(classified, supabase);
  },
};
```

## 5. Pipeline Steps

### `fetch.ts`

**RSS and short descriptions (real-world feeds).** Many feeds expose only a **~150–250 character** `<description>` teaser, not the full article. That is expected — **impact on the product is small:** each cluster combines **many** items (several RSS + X), and Gemini **synthesizes** from the bundle, not from a single long article. The **800-character** slice in `summarize.ts` stays a safe cap.

**Content extraction (no new deps, no scraping, $0).** Inside the RSS parsing loop, build `RawItem.content` by **preferring full body when the feed provides it**, then fall back to the teaser. Strip HTML tags, normalize whitespace, then **`.slice(0, 800)`** for a consistent upper bound. Adjust property access to match your RSS parser’s shape (arrays vs strings).

```ts
const itemContent =
  entry['content:encoded']?.[0] ??
  entry.content?.[0]?._ ??
  entry.description?.[0] ??
  entry['media:description']?.[0] ??
  '';

const cleanContent = itemContent
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 800);
```

Feeds that ship `content:encoded` or Atom full text (Reuters, AP, TechCrunch, Bloomberg, etc., **when available**) yield richer `content`; teaser-only feeds remain **usable** thanks to **clustering + X** in the same pool.

**RSS sources** (hard-coded URLs, no env var needed):
- Reuters, AP, TechCrunch, WSJ, Bloomberg.

**X / Twitter** — Official X API v2 Basic tier (free, no credit card).
- Library: `@twitter-api-v2` (zero extra deps beyond existing stack).
- Endpoint: Recent Search (last 7 days window, filter to yesterday via `since`).
- Exact query:
  ```
  (news OR breaking OR update OR analysis) lang:en -filter:replies -filter:quote min_faves:50
  ```
- Pull top 20 results sorted by relevance/recency.
- Budget: ~20–40 items/day well within the 10,000 tweet/month Basic tier limit.
- Each tweet is mapped to a `RawItem` identically to RSS items — no special handling, feeds straight into embed → cluster.

Return `RawItem[]` (deduplicate by URL/tweet ID inside this function).

### `embed.ts`

- Use official `@google/generative-ai` Node SDK.
- Model: `gemini-embedding-2-preview`.
- **`outputDimensionality: 768`** on every `embedContent` request so vectors match `vector(768)` in Supabase (see *Embedding vector size* above).
- Batch size: 20 (max per call).
- Return `EmbeddedItem[]`.

### `cluster.ts`

**Purpose:** group today's `EmbeddedItem[]` into semantically related `Cluster[]`, each representing one news story told by multiple sources. Also deduplicate against any clusters already persisted for today (idempotent re-run safety).

**Algorithm: greedy single-linkage clustering (in-memory).**

All work happens in-memory — no temporary tables, no DB writes. The only DB read is the optional deduplication check against already-persisted clusters from an earlier same-day run.

#### Constants

```ts
const SIMILARITY_THRESHOLD = 0.85;
```

#### Cosine similarity helper

```ts
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### Centroid computation

The centroid of a cluster is the **element-wise mean** of all member embeddings. It is recomputed every time a new item joins the cluster.

```ts
function computeCentroid(items: EmbeddedItem[]): number[] {
  const dim = items[0].embedding.length; // 768
  const centroid = new Array<number>(dim).fill(0);
  for (const item of items) {
    for (let i = 0; i < dim; i++) centroid[i] += item.embedding[i];
  }
  for (let i = 0; i < dim; i++) centroid[i] /= items.length;
  return centroid;
}
```

#### Main loop (pseudo-code, then full TypeScript)

```
clusters ← []
for each item in embeddedItems:
    bestCluster ← null
    bestSimilarity ← -1
    for each cluster in clusters:
        sim ← cosineSimilarity(item.embedding, cluster.centroidEmbedding)
        if sim > bestSimilarity:
            bestSimilarity ← sim
            bestCluster ← cluster
    if bestSimilarity ≥ SIMILARITY_THRESHOLD:
        bestCluster.items.push(item)
        bestCluster.centroidEmbedding ← computeCentroid(bestCluster.items)
    else:
        clusters.push(new Cluster { items: [item], centroidEmbedding: item.embedding })
return clusters
```

#### Full TypeScript

```ts
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmbeddedItem, Cluster } from '../types/digest';

const SIMILARITY_THRESHOLD = 0.85;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeCentroid(items: EmbeddedItem[]): number[] {
  const dim = items[0].embedding.length;
  const centroid = new Array<number>(dim).fill(0);
  for (const item of items) {
    for (let i = 0; i < dim; i++) centroid[i] += item.embedding[i];
  }
  for (let i = 0; i < dim; i++) centroid[i] /= items.length;
  return centroid;
}

export async function clusterItems(
  items: EmbeddedItem[],
  supabase: SupabaseClient,
): Promise<Cluster[]> {
  const clusters: Cluster[] = [];

  for (const item of items) {
    let bestIdx = -1;
    let bestSim = -1;

    for (let i = 0; i < clusters.length; i++) {
      const sim = cosineSimilarity(item.embedding, clusters[i].centroidEmbedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD && bestIdx !== -1) {
      clusters[bestIdx].items.push(item);
      clusters[bestIdx].centroidEmbedding = computeCentroid(clusters[bestIdx].items);
    } else {
      clusters.push({
        id: uuidv4(),
        items: [item],
        centroidEmbedding: [...item.embedding],
      });
    }
  }

  return clusters;
}
```

#### Why greedy single-linkage is the right choice here

- **O(n × k)** where n = items (~60–100/day) and k = clusters (~15–30). Runs in < 5 ms for realistic daily volumes — no fancy data structures needed.
- Deterministic: item order from `fetch.ts` determines cluster assignment. RSS items arrive in published-date order, so closely related stories (published minutes apart) naturally cluster together.
- Centroid recomputation on every merge keeps the cluster center stable as more sources join, preventing drift toward the first item only.
- The 0.85 threshold is deliberately high — it groups *the same story told by different outlets* (e.g. "Fed raises rates" from Reuters, AP, Bloomberg) while keeping genuinely distinct stories apart (e.g. "Fed raises rates" vs "Tech layoffs").

#### Deduplication against already-persisted clusters

The entry point (`+server.ts` §8) already checks for existing rows and returns early if today's digest exists. Therefore `cluster.ts` does **not** need its own DB dedup query — it operates purely on fresh in-memory data from `embed.ts`. The SQL query shown in the original spec is handled by the idempotency guard in the entry point, not inside clustering.

#### Edge cases

- **Zero items** from `fetch.ts` → return `[]` (pipeline completes with no clusters; `upsert.ts` writes nothing).
- **Single item** → one cluster with that item as both sole member and centroid.
- **All items identical** (similarity = 1.0) → one big cluster. Gemini summarize still works; it just has redundant input.

### `summarize.ts`

- Model: `gemini-2.5-flash`.
- **Structured output:** use the official Gemini JSON mode (`generationConfig.responseMimeType` + `responseSchema` on the model) so the model cannot return prose, markdown fences, or extra keys. Parse with `JSON.parse(result.response.text())` — no regex fallbacks.

```ts
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
        whyItMatters: { type: 'string' },
      },
      required: ['headline', 'bullets', 'whyItMatters'],
    },
  },
});

const SUMMARY_PROMPT = `You are a brutalist news editor for 2min.today.

Cluster of reports:
${JSON.stringify(cluster.items.map(i => ({ title: i.title, content: i.content.slice(0, 800) })))}

Return ONLY valid JSON matching this schema:
{
  "headline": "max 12 words",
  "bullets": ["exactly 3 bullets, max 25 words each"],
  "whyItMatters": "max 30 words"
}

Tone: dense, zero fluff, future-facing.`;

const result = await model.generateContent(SUMMARY_PROMPT);
const parsed = JSON.parse(result.response.text()) as {
  headline: string;
  bullets: string[];
  whyItMatters: string;
};
```

- Map `parsed` onto `SummarizedCluster` (`headline`, `bullets`, `whyItMatters`).

### `classify.ts`

- Import `BUCKET_ANCHORS` from `$lib/config/buckets`.
- Fetch bucket anchor embeddings from Supabase (seeded once via `scripts/seed-bucket-anchors.ts`).
- For each cluster centroid:

```sql
SELECT bucket, 1 - (embedding <=> $1) AS similarity
FROM bucket_anchors
ORDER BY similarity DESC LIMIT 1;
```

- If max similarity ≥ 0.65 → assign bucket.
- Else → `bucket = 'Emerging'`, call Gemini once for `categoryLine` (max 8 words).

### `upsert.ts`

**No Postgres transaction via Supabase JS** — the REST client does not expose multi-statement transactions in a simple, reliable way. Instead, **one daily write pattern** at the end of `pipeline.run()` (all in-memory work already finished):

1. **Delete** all `clusters` rows whose `published_at` falls in **today’s UTC window** (same `todayStart` / `todayEnd` as §8).
2. **Bulk insert/upsert** the full set of classified clusters for this run in **one** `.upsert(...)` call.

From a **reader’s perspective**, the homepage either sees **yesterday’s data** (run not finished), **nothing for today** (window empty), or the **complete new edition** — never a half-written mix of old and new clusters for the same day. End-to-end latency stays within the **2 s** target (one delete + one bulk write).

```ts
const now = new Date();
const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

await supabase
  .from('clusters')
  .delete()
  .gte('published_at', todayStart.toISOString())
  .lt('published_at', todayEnd.toISOString());

await supabase.from('clusters').upsert(
  classifiedClusters.map(c => ({
    id: c.id,
    embedding: c.centroidEmbedding,
    raw_items: c.items,
    summary: {
      headline: c.headline,
      bullets: c.bullets,
      why_it_matters: c.whyItMatters,
    },
    bucket: c.bucket,
    category_line: c.categoryLine,
    published_at: new Date().toISOString(),
  })),
  { onConflict: 'id' }
);
```

- Shape **`summary`** jsonb for §9: `headline`, `bullets`, `why_it_matters`, optional `sources` later (**snake_case** in DB).

**Failure note:** if **delete** succeeds and **upsert** throws, today’s window is empty until a successful retry; idempotency (§8) allows the cron to run again the same UTC day and repopulate. Failures **before** this block leave prior data untouched.

## 6. Database Schema (`supabase/migrations/001-pgvector.sql`)

```sql
create extension if not exists vector;

create table clusters (
  id            uuid primary key default gen_random_uuid(),
  embedding     vector(768),
  raw_items     jsonb,
  summary       jsonb,
  bucket        text,
  category_line text,
  published_at  timestamptz default now()
);

create index idx_clusters_embedding on clusters using hnsw (embedding vector_cosine_ops);

-- Bucket anchors: 5 fixed rows, seeded once via scripts/seed-bucket-anchors.ts
create table if not exists bucket_anchors (
  bucket    text primary key
    check (bucket in ('World', 'Business', 'Tech', 'Science', 'Health')),
  embedding vector(768) not null
);
-- No HNSW index needed — only 5 rows, sequential scan is faster
```

## 7. Bucket Anchor Seed Script (`scripts/seed-bucket-anchors.ts`)

Run **once** after applying the migration. Idempotent (upsert on primary key).

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { BUCKET_ANCHORS } from '../src/lib/config/buckets';
import 'dotenv/config'; // load .env.local for local execution

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedAnchors() {
  for (const [bucket, text] of Object.entries(BUCKET_ANCHORS)) {
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: 768,
    });
    const embedding = result.embedding.values;

    await supabase
      .from('bucket_anchors')
      .upsert({ bucket, embedding }, { onConflict: 'bucket' });

    console.log(`✓ Seeded ${bucket}`);
  }
  console.log('All bucket anchors seeded.');
}

seedAnchors().catch(console.error);
```

Run with:

```bash
npx tsx scripts/seed-bucket-anchors.ts
```

> Note: the seed script uses `process.env` directly (not `$env/dynamic/private`) because it runs
> outside SvelteKit, as a plain Node script via `tsx`.

## 8. Entry Point (`+server.ts`)

> **Updated:** Trigger moved from Vercel Cron to GitHub Actions (`.github/workflows/daily-digest.yml`) to consolidate both pipeline triggers (nightly digest + breaking news from RFC-005) in one place. `vercel.json` has no cron configuration. The endpoint contract is unchanged.

A `CRON_SECRET` env var guards the endpoint against accidental or malicious triggers
(Gemini calls cost quota even on the free tier). The secret is passed as a query param
by the GitHub Actions workflow and stored in Vercel dashboard environment variables.

Idempotency uses UTC day boundary range filters — `eq('published_at::date', ...)` is invalid in
the Supabase JS client (it treats the left side as a literal column name). `.gte` / `.lt` against
pre-computed ISO strings is the correct approach and hits the native index on `published_at`.

```ts
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/server';
import { pipeline } from '$lib/pipeline';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async ({ url }: RequestEvent) => {
  if (url.searchParams.get('secret') !== env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .gte('published_at', todayStart.toISOString())
    .lt('published_at', todayEnd.toISOString())
    .limit(1);

  if (existing?.length) return json({ status: 'already-run-today' });

  const result = await pipeline.run(supabase);
  return json({ status: 'success', clustersCreated: result.length });
};
```

The pipeline is triggered by a GitHub Actions scheduled workflow (`.github/workflows/daily-digest.yml`) rather than Vercel Cron. `vercel.json` has no cron configuration.

```yaml
name: Daily Digest

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger digest pipeline
        run: |
          curl -sf "${{ secrets.APP_URL }}/api/digest?secret=${{ secrets.CRON_SECRET }}" \
            -o /dev/null \
            --max-time 60
```

Both pipeline triggers (nightly digest + breaking news) use the same two GitHub secrets: `APP_URL` and their respective `CRON_SECRET` / `BREAKING_SECRET`.

## 9. Homepage: Supabase read (SSR, mock → live)

**Principles:** same brutalist minimalism as today — **one server `load`**, **no client-side data fetching** for the digest, **SSR by default**, props shaped so `+page.svelte` can replace `mockData` with `data.digest` (bucket → items). UTC day window **must match** the pipeline idempotency window in §8 (`todayStart` / `todayEnd`).

**RLS:** Supabase must allow **anonymous `SELECT`** on `clusters` (and any join) for rows that should appear on the public homepage — e.g. policy on `published_at` or “authenticated read of published digest”. Without this, `load` returns an empty or denied result.

### `lib/supabase/client.ts`

Anon client using SvelteKit **public** env (prefixed `PUBLIC_`, exposed to the server and optionally to the browser). Add **`PUBLIC_SUPABASE_URL`** and **`PUBLIC_SUPABASE_ANON_KEY`** to `apps/web/.env.example`, `.env.local`, and Vercel.

```ts
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

export const supabaseClient = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
```

### `routes/+page.server.ts`

Exact query shape for today’s edition. Use **`import type { Bucket }`** only — do not value-import `$lib/config/buckets` from any file that ships to the browser (YAML + `fs` stay server-only).

Persisted **`summary` jsonb** (written by `upsert.ts`) must align with this read path, e.g.:

```json
{
  "headline": "string",
  "bullets": ["string", "string", "string"],
  "why_it_matters": "string",
  "sources": []
}
```

(`sources` optional until the pipeline attaches them.)

```ts
import { supabaseClient } from '$lib/supabase/client';
import type { Bucket } from '$lib/config/buckets';

type SummaryJson = {
  headline: string;
  bullets: string[];
  why_it_matters: string;
  sources?: unknown;
};

type DigestCard = {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  categoryLine: string | null;
  sources: unknown[];
};

export const load = async () => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await supabaseClient
    .from('clusters')
    .select('id, bucket, category_line, summary, published_at')
    .gte('published_at', todayStart.toISOString())
    .lt('published_at', todayEnd.toISOString())
    .order('published_at', { ascending: false });

  if (error) {
    console.error(error);
    return { digest: {} as Partial<Record<Bucket, DigestCard[]>> };
  }

  const digest = (data ?? []).reduce<Partial<Record<Bucket, DigestCard[]>>>((acc, row) => {
    const b = row.bucket as Bucket;
    const s = row.summary as SummaryJson;
    if (!acc[b]) acc[b] = [];
    acc[b]!.push({
      headline: s.headline,
      bullets: s.bullets,
      whyItMatters: s.why_it_matters,
      categoryLine: row.category_line,
      sources: Array.isArray(s.sources) ? s.sources : [],
    });
    return acc;
  }, {});

  return { digest };
};
```

### `+page.svelte` (migration from mock)

Receive `data` from `load` and render sections by bucket — no `fetch` in the component for this data:

```svelte
{#each Object.entries(data.digest) as [bucket, items]}
  <section class="bucket-grid">
    <h2>{bucket}</h2>
    {#each items as item}
      <!-- map item.headline, item.bullets, item.whyItMatters, item.categoryLine to existing brutalist card markup -->
    {/each}
  </section>
{/each}
```

Until the pipeline ships, keep `mockData` behind a guard or feature flag if needed.

## 10. Error Handling

- Gemini rate limit → exponential backoff (1 s → 2 s → 4 s, max 3 retries).
- Any step **before** `upsert.ts`’s delete/upsert pair fails → log, return **500**, **no DB change** for that day’s window (see `upsert.ts` failure note).
- Do **not** return a **`partial`** success flag while also writing incomplete rows; persistence strategy is **delete-today + bulk upsert** only (§5 `upsert.ts`), not per-cluster incremental writes.

## 11. Local vs Production

- Local: `pnpm dev` + `GET /api/digest?secret=<CRON_SECRET>` (browser or curl).
- Production: GitHub Actions (`daily-digest.yml`) — see §8. Both the nightly digest and breaking news pipeline (RFC-005) use the same `APP_URL` GitHub secret.

## 12. One-Time Setup

1. Copy `apps/web/.env.example` → `apps/web/.env.local` and fill in all values (private vars for pipeline + **`PUBLIC_SUPABASE_URL`** / **`PUBLIC_SUPABASE_ANON_KEY`** for homepage SSR).
2. Add the same keys to Vercel dashboard → Environment Variables.
3. Run migration `001-pgvector.sql` (creates `clusters` + `bucket_anchors` tables).
4. Run `npx tsx scripts/seed-bucket-anchors.ts` to embed and store the 5 anchor vectors.
5. Configure Supabase **RLS** so anonymous (or your chosen role) can `SELECT` the `clusters` rows the homepage should show.
6. Add `APP_URL` and `CRON_SECRET` to GitHub repository secrets (Settings → Secrets → Actions). `APP_URL` is shared with the breaking news workflow (RFC-005).

## References

- ADR-001 (Backend Stack)
- ADR-002 (Pipeline Architecture)
- Gemini Node SDK (`embeddings`, `generateContent`, structured JSON via `responseSchema`)
- Supabase pgvector cosine guide
