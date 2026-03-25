# RFC-001: Daily Digest Pipeline

**Status:** Approved for Implementation
**Date:** 2026-03-25
**Author:** Grok (detailed spec) / Project Owner
**Target files:** `/src/routes/api/digest/+server.ts` + `/src/lib/pipeline/*`

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

## File Layout

```
/src
├── routes/api/digest/+server.ts                 ← entry point (POST handler)
├── lib/pipeline/
│   ├── fetch.ts          ← returns RawItem[]
│   ├── embed.ts          ← returns EmbeddedItem[]
│   ├── cluster.ts        ← returns Cluster[]
│   ├── summarize.ts      ← returns SummarizedCluster[]
│   ├── classify.ts       ← returns ClassifiedCluster[]
│   └── upsert.ts         ← writes to Supabase
├── lib/types/digest.ts   ← all TypeScript interfaces
└── supabase/migrations/001-pgvector.sql
```

## 1. Types (`lib/types/digest.ts`)

```ts
export interface RawItem {
  id: string;
  title: string;
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
  bucket: 'World' | 'Tech' | 'Economy' | 'Science' | 'Culture' | 'Emerging';
  categoryLine: string | null; // only for Emerging
}
```

## 2. Pipeline Steps

### `fetch.ts`

- Fetch RSS from: Reuters, AP, TechCrunch, WSJ, Bloomberg (hard-coded URLs in env).
- X semantic search: query `"global news today"` with `x_semantic_search` (limit 20, last 24 h).
- Return `RawItem[]` (deduplicate by URL inside this function).

### `embed.ts`

- Use official `@google/generative-ai` Node SDK.
- Model: `gemini-embedding-2-preview`.
- Batch size: 20 (max per call).
- Return `EmbeddedItem[]`.

### `cluster.ts`

- Insert all embeddings into a temporary table or use in-memory cosine.
- Run single SQL:

```sql
SELECT id, embedding <=> $1 AS similarity
FROM clusters
WHERE published_at::date = CURRENT_DATE
ORDER BY similarity LIMIT 1;
```

- Threshold: `0.85` for deduplication → group into `Cluster[]`.
- Return clusters with centroid embedding.

### `summarize.ts`

- Model: `gemini-1.5-flash`.
- Exact prompt (copy-paste this):

```ts
const SUMMARY_PROMPT = `You are a brutalist news editor for 2min.today.

Cluster of reports:
${JSON.stringify(cluster.items.map(i => ({ title: i.title, content: i.content.slice(0, 800) })))}

Rules:
1. One crisp headline (max 12 words)
2. Exactly three bullets (max 25 words each)
3. One "Why it Matters" sentence (max 30 words)

Tone: dense, zero fluff, future-facing. No marketing language.`;

const result = await model.generateContent(SUMMARY_PROMPT);
```

- Parse JSON response strictly.

### `classify.ts`

- Pre-store 5 bucket anchor embeddings in Supabase (one-time seed).
- For each cluster centroid:

```sql
SELECT bucket, 1 - (embedding <=> $1) AS similarity
FROM bucket_anchors
ORDER BY similarity DESC LIMIT 1;
```

- If max similarity ≥ 0.65 → assign bucket.
- Else → `bucket = 'Emerging'`, call Gemini once for `categoryLine` (max 8 words).

### `upsert.ts`

- Single upsert per cluster using `published_at::date` as unique key.
- JSONB fields for `raw_items` and `summary`.

## 3. Entry Point (`+server.ts`)

```ts
import { json } from '@sveltejs/kit';
import { pipeline } from '$lib/pipeline';

export const POST = async () => {
  const today = new Date().toISOString().split('T')[0];
  const existing = await supabase.from('clusters').select('id').eq('published_at::date', today).limit(1);
  if (existing.data?.length) return json({ status: 'already-run-today' });

  const result = await pipeline.run();
  return json({ status: 'success', clustersCreated: result.length });
};
```

## 4. Error Handling

- Gemini rate limit → exponential backoff (1 s → 2 s → 4 s, max 3 retries).
- Any step fails → log to console + return 500 with `partial` flag.
- Never leave partial data in DB.

## 5. Local vs Production

- Local: `pnpm dev` + manual `POST` to `/api/digest`.
- Production: Vercel Cron only.

## 6. One-Time Setup

1. Run migration `001-pgvector.sql`.
2. Seed 5 bucket anchors (`World`, `Tech`, `Economy`, `Science`, `Culture`) with their embeddings.

## References

- ADR-001 (Backend Stack)
- ADR-002 (Pipeline Architecture)
- Gemini Node SDK (`embeddings` + `generateContent`)
- Supabase pgvector cosine guide
