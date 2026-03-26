# RFC-002: Client-Side Global Search + Per-Cluster Tagging (Display)

**Status:** Approved for Implementation (amended: tag **filtering** removed; **search** is header-only — no secondary digest chrome or `clearAllFilters`)  
**Date:** 2026-03-25  
**Author:** Grok (detailed spec) / Project Owner  
**Target files:** `apps/web/src/lib/types/digest.ts` + `apps/web/src/lib/pipeline/summarize.ts` + `apps/web/src/lib/pipeline/upsert.ts` + `apps/web/src/lib/digest-filter.ts` + `apps/web/src/lib/mock-tags.ts` + `apps/web/src/lib/mock-digest.ts` + `apps/web/src/routes/+page.server.ts` + `apps/web/src/routes/+page.svelte` + `apps/web/src/routes/+layout.svelte` + `apps/web/src/app.css` (e.g. `.summary-text`) + `packages/ui/src/components/GlobalSearch.svelte` + `packages/ui/src/components/Header.svelte` + `apps/web/package.json` + `apps/web/.env.example` + `packages/ui` digest tile components (`NewsTags` / `NewsCard` / `CategoryRow` / `CategoryPanel`)

## Purpose

This RFC **extends [RFC-001: Daily Digest Pipeline](0001-daily-digest-pipeline.md)**. It adds client-side fuzzy search and pipeline-generated tags on top of the existing digest shape, SSR `load`, and cron pipeline. It does **not** redefine ingestion, clustering, classification, or Supabase layout except where `summary` jsonb gains a `tags` field.

Add a **global fuzzy search** (client-side) and **per-cluster tags** (pipeline-generated, **display only** on tiles — own row under “Why it matters”, shared **`.summary-text`** styling with category panel **summary** lines in `app.css`).

The interface remains brutalist: one search field wired to the existing header control, tiles stay typography-first, zero images, rigid grid. Filtering runs on SSR data already on the page — **no extra API calls**, no client-side database. Target sub-10 ms feel on a ~30-tile digest after debounced search.

Search is **fuzzy over text fields** (headline + bullets + `whyItMatters`) via [Fuse.js](https://fusejs.io/) (edit-distance style matching — **not** embedding-based semantic search; a future RFC would cover that).

Tags are **3–5 crisp keywords** in the ideal case, generated in the **same** Gemini call as the summary JSON. They are **not** used to filter the digest on the client (single-day cardinality was too high for useful filtering); a future RFC may reintroduce tag filtering if the product needs it.

**Cost / latency:** no additional Gemini round-trip; output tokens increase slightly. Wording: **minimal extra cost**, not strictly zero.

## Environment variables

All are read on the server in **`+page.server.ts`** via `$env/dynamic/private` (same pattern as other private vars). Document in [`apps/web/.env.example`](../../apps/web/.env.example).

| Variable | Required | Default | Behaviour |
|----------|----------|---------|-----------|
| `USE_MOCK_DATA` | No | off | **Only** the string **`true`** counts as enabled: `env.USE_MOCK_DATA?.trim() === 'true'` (case-sensitive). Values such as `1`, `yes`, or `TRUE` are **not** mock mode. When enabled, `load` **does not** query Supabase; returns **`buildMockDigest()`** (see §3). |
| `DIGEST_FUSE_THRESHOLD` | No | `0.4` if unset or invalid | Parsed as float; returned to the client as `data.fuseThreshold` for Fuse.js (avoids needing a `PUBLIC_` duplicate). |

Production: leave `USE_MOCK_DATA` unset, empty, or any value other than exactly `true`.

## Exact Behaviour Rules

1. **Search**
   - Input lives in [`packages/ui` `GlobalSearch`](../../packages/ui/src/components/GlobalSearch.svelte), centered in the header; value is **bound** into shared app state (see **§4 Shared client state** and **§5 Header wiring**). **No** secondary strip below the header (no duplicate “search: …” line or extra clear button — the field itself is the single source of truth; user clears by editing or clearing the input, including native `type="search"` affordances where available).
   - **Debounce 150 ms** after typing before updating the string used for Fuse (keeps work off the critical path).
   - Fuse runs on `headline`, `bullets`, and `whyItMatters` (confirm Fuse v7 `keys` / nested behaviour so **array `bullets`** participate).
   - Empty debounced search string ⇒ **no** search filter (full card set).

2. **Tags (pipeline + UI, no client filter)**
   - Generated **only** in `summarize.ts` (same Gemini structured output as headline / bullets / why).
   - Stored in `summary` jsonb as `tags: string[]` (prefer up to **5** entries; single words or short phrases).
   - **Normalization after parse (required):** coerce to array; trim strings; drop empties; **cap at 5**; accept **fewer than 3** tags if the model returns fewer (do **not** fail the pipeline on short `tags`).
   - Rendered in a **row below** “Why it matters”, right-aligned **`#tag`** tokens, **`.summary-text`** in [`app.css`](../../apps/web/src/app.css) (size/opacity + `cursor-text` on the tag container).
   - **No** global selected set, **`localStorage`**, or click-to-filter on tags. Chips are **presentational** (`<span>`).

3. **Search-only filtering**

   - If debounced query is non-empty, **`filteredCards`** = Fuse results over **`allCards`**; if empty, **`filteredCards`** = **`allCards`**.

4. **Idempotency and data**

   - Pipeline still produces exactly one daily edition; `published_at` idempotency unchanged (RFC-001).
   - Homepage SSR delivers the full digest once; search filtering is **client-side only**.

5. **Performance**

   - Rebuild the Fuse index when `allCards` / digest data changes (`$derived` or equivalent — **no stale index**).

6. **Hydration**

   - No tag selection from storage; first paint matches SSR for tags. Search state starts empty until the user types.

## Out of scope

- **Client-side filtering by tags** (removed for v1; may return in a later RFC if editorial/product needs it).
- **History / backfill / re-summarize:** no. Rows without `tags` are treated as **`[]`** in `+page.server.ts`. A separate RFC would cover historical editions or migrations.
- **Semantic (embedding) search** on the client.

## File layout

```
apps/web/
├── .env.example
├── package.json                              ← fuse.js
├── src/
│   ├── app.css                               ← .summary-text, .news-tile, scrollbars
│   ├── lib/
│   │   ├── digest-filter.ts                  ← writable stores: searchQuery, debouncedSearchQuery (150 ms debounce)
│   │   ├── config/buckets.constants.ts       ← BUCKET_ORDER + Bucket (client-safe; no fs — see note below)
│   │   ├── config/buckets.ts                 ← YAML + fs: BUCKET_ANCHORS (server / scripts only)
│   │   ├── mock-tags.ts                      ← deduceMockTags + bulletsFromMockContent
│   │   ├── mock-digest.ts                    ← buildMockDigest() for USE_MOCK_DATA + client fallback
│   │   ├── types/digest.ts
│   │   └── pipeline/
│   │       ├── summarize.ts
│   │       └── upsert.ts
│   └── routes/
│       ├── +layout.svelte                    ← Header bind:searchQuery={$searchQuery}
│       ├── +page.server.ts
│       └── +page.svelte
packages/ui/src/components/
├── GlobalSearch.svelte                       ← $bindable value
├── Header.svelte                             ← $bindable searchQuery → GlobalSearch
└── digest/
    ├── NewsTags.svelte
    ├── NewsCard.svelte
    ├── CategoryRow.svelte
    └── CategoryPanel.svelte
```

**Note:** [`buckets.ts`](../../apps/web/src/lib/config/buckets.ts) uses Node **`fs`** to read `buckets.yaml`. Client code (e.g. **`+page.svelte`**) must import **`BUCKET_ORDER`** / **`Bucket`** from [`buckets.constants.ts`](../../apps/web/src/lib/config/buckets.constants.ts) only so Vite does not bundle `fs` in the browser.

## TypeScript types

**Pipeline types** live in [`apps/web/src/lib/types/digest.ts`](../../apps/web/src/lib/types/digest.ts). **`DigestCard`** remains defined next to `load` in [`+page.server.ts`](../../apps/web/src/routes/+page.server.ts) (or extract to a shared module if preferred) — keep a single source of truth for the homepage card shape.

```ts
export interface SummarizedCluster extends Cluster {
  headline: string;
  bullets: string[]; // exactly 3
  whyItMatters: string;
  tags: string[];
}

export interface ClassifiedCluster extends SummarizedCluster {
  bucket: Bucket;
  categoryLine: string | null;
}

// Homepage card (see +page.server.ts export)
export interface DigestCard {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  categoryLine: string | null;
  sources: unknown[];
  bucket: Bucket; // required for flat → filter → regroup with fixed bucket order
}
```

## 1. Pipeline: generate tags (`lib/pipeline/summarize.ts`)

Extend structured JSON (no extra API call). Production uses `@google/generative-ai` **`SchemaType`** (see existing `summarize.ts`); the sketch below is illustrative.

After `JSON.parse`, **normalize** `tags` as described in **Exact Behaviour Rules** before building `SummarizedCluster`.

```ts
// Illustrative — use SchemaType.OBJECT / STRING / ARRAY in real code
tags: { type: 'array', items: { type: 'string' } }
// required: include 'tags' in required[]; do not rely on minItems: 3 for runtime safety
```

Prompt JSON example must include the `tags` array line. Use **`getFlashModel()`** from `lib/server/digest/models.ts` (env **`FLASH_MODEL`**).

## 2. Persist tags (`lib/pipeline/upsert.ts`)

No new top-level columns if `summary` stays jsonb.

```ts
summary: {
  headline: c.headline,
  bullets: c.bullets,
  why_it_matters: c.whyItMatters,
  tags: c.tags,
},
```

## 3. Homepage `load` (`routes/+page.server.ts`)

- Extend `SummaryJson` with optional `tags`.
- Map `tags: Array.isArray(s.tags) ? s.tags : []`.
- Push `bucket: b` on each card.
- Return **`fuseThreshold`** from `DIGEST_FUSE_THRESHOLD` (parse float, fallback `0.4`).
- If **`USE_MOCK_DATA === 'true'`** (after trim), return **`buildMockDigest()`** from [`mock-digest.ts`](../../apps/web/src/lib/mock-digest.ts) and **skip** Supabase (see **Mock digest tags** below).

### Mock digest tags (`USE_MOCK_DATA`)

Implementation: **`buildMockDigest()`** maps [`mock-data.ts`](../../apps/web/src/lib/mock-data.ts) into `Partial<Record<Bucket, DigestCard[]>>`, using **`bulletsFromMockContent`** and **`deduceMockTags(title, source, bucket)`** from [`mock-tags.ts`](../../apps/web/src/lib/mock-tags.ts).

For each mock news item, `tags` are **1–3 short tokens** deduced from the headline (and fallback `source` / bucket) — no LLM.

- **Count:** minimum **1**, maximum **3** strings per card.
- **Heuristic:** normalize headline, strip punctuation, split, drop stopwords, dedupe, sort by length descending, take up to **3**; if empty, one tag from normalized `source` or bucket name.
- **Cost:** trivial string work on `load` / client fallback only.

**Live Supabase branch** — for each row, `if (!acc[b]) acc[b] = []`, then push a card with `tags` filtered to strings only; **`return { digest, fuseThreshold }`** (including on Supabase error — empty digest + threshold).

**Client fallback:** when SSR returns an **empty** `digest`, [`+page.svelte`](../../apps/web/src/routes/+page.svelte) uses **`buildMockDigest()`** as `sourceDigest` so search still works without `USE_MOCK_DATA`.

## 4. Shared client state (`lib/digest-filter.ts`)

**Implementation choice:** plain module with **Svelte `writable` stores** (not `$state` in a `.svelte.ts` file). Exported `$state` from a shared module cannot be assigned from plain functions under TypeScript, and **`bind:` cannot target a named import** of that state from `+layout.svelte`. Stores fix both: the layout uses **`bind:searchQuery={$searchQuery}`** (auto-subscription).

Exports:

- **`searchQuery`** — `writable('')`, two-way bound to header input
- **`debouncedSearchQuery`** — `writable('')`, updated from `searchQuery` via **`subscribe`** + **150 ms** `setTimeout` debounce (clear previous timer on each keystroke)

**Homepage:** [`+page.svelte`](../../apps/web/src/routes/+page.svelte) **`subscribe`**s to **`debouncedSearchQuery`** inside **`$effect`**, copies into local **`$state`** (`debouncedQ`) so **`$derived.by`** for **`filteredCards`** re-runs when the debounced query changes.

## 5. Header wiring (`packages/ui` + `+layout.svelte`)

- **`GlobalSearch.svelte`:** `value = $bindable('')`, **`bind:value`** on the input; optional **`placeholder`** prop (app passes **`SEARCH DIGEST`**). Use **`type="search"`** so browsers may show a native clear control.
- **`Header.svelte`:** `searchQuery = $bindable('')`, **`searchPlaceholder`** prop forwarded to `GlobalSearch`.
- **`+layout.svelte`:** `import { searchQuery } from '$lib/digest-filter'` and **`<Header bind:searchQuery={$searchQuery} searchPlaceholder="SEARCH DIGEST" />`**. Clearing the input updates **`searchQuery`**; **`debouncedSearchQuery`** follows after the debounce.

## 6. Homepage UI and filtering (`routes/+page.svelte`)

Merged with the **existing** marquee / bucket layout. Implemented behaviour:

- **`sourceDigest`:** if `data.digest` has keys, use it; else **`buildMockDigest()`** (same shape as mock server path).
- **`allCards`:** flatten `sourceDigest` with **`Object.entries`** (each card already has **`bucket`** on the server; mock cards include it too). Import **`BUCKET_ORDER`** from **`$lib/config/buckets.constants`** (not **`buckets.ts`** — avoids bundling **`fs`**).
- **`Fuse`:** `$derived` when `allCards` or **`data.fuseThreshold`** changes. **`bullets`** are searched via a **`getFn`** that **`join(' ')`**s the array (Fuse v7 does not treat `bullets[]` as text by default).
- **`filteredCards`:** read **`debouncedQ`**; if trimmed query non-empty, Fuse search over **`allCards`**; else all cards. **`filteredDigest`** regroups by **`bucket`** using a local list reference after `if (!acc[b]) acc[b] = []` (no non-null assertion).
- **`liveToCategories(filteredDigest)`** with fixed **`BUCKET_ORDER`**.
- **No** digest-level search chrome beyond the header field and optional empty state (see below).
- **Tiles:** tags as **presentational** **`#`**-prefixed tokens under “Why it matters” (no filter behaviour).
- **`showFilteredEmpty`:** *No matches. Try broadening your search.*

Illustrative core (abbreviated):

```svelte
<script lang="ts">
  import Fuse from 'fuse.js';
  import { BUCKET_ORDER, type Bucket } from '$lib/config/buckets.constants';
  import { buildMockDigest } from '$lib/mock-digest';
  import { debouncedSearchQuery } from '$lib/digest-filter';
  import type { DigestCard } from './+page.server';

  let debouncedQ = $state('');

  $effect(() => {
    const u = debouncedSearchQuery.subscribe((v) => {
      debouncedQ = v;
    });
    return () => u();
  });

  const sourceDigest = $derived(
    data.digest && Object.keys(data.digest).length > 0 ? data.digest : buildMockDigest(),
  );

  const allCards = $derived(/* flatten sourceDigest with bucket on each row */);

  const fuse = $derived(
    new Fuse(allCards, {
      keys: [
        'headline',
        'whyItMatters',
        { name: 'bullets', getFn: (c) => c.bullets.join(' ') },
      ],
      threshold: data.fuseThreshold,
      ignoreLocation: true,
    }),
  );

  const filteredCards = $derived.by(() => {
    let results = allCards;
    const q = debouncedQ.trim();
    if (q) results = fuse.search(q).map((r) => r.item);
    return results;
  });
</script>
```

## 7. One-time setup

```bash
pnpm add fuse.js --filter=web
```

No DB migration if `tags` only extend `summary` jsonb.

After deploy, the **next** pipeline run fills `tags` for new writes; **no backfill** per **Out of scope**.

## 8. Error handling and edge cases

- **Zero results** after search: show *No matches. Try broadening your search.* User broadens or clears the **header** search field.
- **Empty `tags` on a card:** render no tag row for that tile.
- **Pipeline parse errors on `tags`:** treat as `[]` for that cluster; still persist headline / bullets / why when possible.
- **Invalid `DIGEST_FUSE_THRESHOLD`:** fallback `0.4`.
- **`pnpm build` / CI:** the app may still import **`api/digest`** during SvelteKit analysis; a valid **Supabase URL** (and related env) may be required for production builds even when only the homepage changed — unrelated to RFC-002 filtering logic.
