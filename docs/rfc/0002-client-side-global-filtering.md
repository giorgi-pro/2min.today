# RFC-002: Client-Side Global Search + Per-Cluster Tagging

**Status:** Approved for Implementation  
**Date:** 2026-03-25  
**Author:** Grok (detailed spec) / Project Owner  
**Target files:** `apps/web/src/lib/types/digest.ts` + `apps/web/src/lib/pipeline/summarize.ts` + `apps/web/src/lib/pipeline/upsert.ts` + `apps/web/src/lib/digest-filter.ts` + `apps/web/src/lib/mock-tags.ts` + `apps/web/src/lib/mock-digest.ts` + `apps/web/src/routes/+page.server.ts` + `apps/web/src/routes/+page.svelte` + `apps/web/src/routes/+layout.svelte` + `packages/ui/src/components/GlobalSearch.svelte` + `packages/ui/src/components/Header.svelte` + `apps/web/package.json` + `apps/web/.env.example`

## Purpose

This RFC **extends [RFC-001: Daily Digest Pipeline](0001-daily-digest-pipeline.md)**. It adds client-side fuzzy search and pipeline-generated tags on top of the existing digest shape, SSR `load`, and cron pipeline. It does **not** redefine ingestion, clustering, classification, or Supabase layout except where `summary` jsonb gains a `tags` field.

Add a **global fuzzy search** (client-side) and **per-cluster tags** (pipeline-generated, displayed bottom-right).

The interface remains brutalist: one search field wired to the existing header control, tiles stay typography-first, zero images, rigid grid. Filtering runs on SSR data already on the page — **no extra API calls**, no client-side database. Target sub-10 ms feel on a ~30-tile digest after debounced search.

Search is **fuzzy over text fields** (headline + bullets + `whyItMatters`) via [Fuse.js](https://fusejs.io/) (edit-distance style matching — **not** embedding-based semantic search; a future RFC would cover that).

Tags are **3–5 crisp keywords** in the ideal case, generated in the **same** Gemini call as the summary JSON.

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
   - Input lives in [`packages/ui` `GlobalSearch`](../../packages/ui/src/components/GlobalSearch.svelte), centered in the header; value is **bound** into shared app state (see **§4 Shared client state** and **§5 Header wiring**).
   - **Debounce 150 ms** after typing before updating the string used for Fuse (keeps work off the critical path).
   - Fuse runs on `headline`, `bullets`, and `whyItMatters` (confirm Fuse v7 `keys` / nested behaviour so **array `bullets`** participate).
   - Empty debounced search string ⇒ no search filter (full card set passed to the tag stage).

2. **Tags**
   - Generated **only** in `summarize.ts` (same Gemini structured output as headline / bullets / why).
   - Stored in `summary` jsonb as `tags: string[]` (prefer up to **5** entries; single words or short phrases).
   - **Normalization after parse (required):** coerce to array; trim strings; drop empties; **cap at 5**; accept **fewer than 3** tags if the model returns fewer (do **not** fail the pipeline on short `tags`).
   - Rendered **bottom-right** of each tile (monospace, small, muted — use Tailwind / tokens from `apps/web/DESIGN.md`, **no** border-radius on chrome).
   - **Selection model:** each distinct tag string can be **on** or **off** in a **global selected set** (not single-tag radio). Persist the set in **`localStorage`** under key **`2min.today:selectedTags`** as `JSON.stringify(string[])`.
   - **Empty selected set ⇒ no tag filter** (all cards remain candidates, subject only to search).
   - **Non-empty selected set:** keep a card if **`card.tags` intersects the selected set** (OR across selected tags: at least one selected tag appears on the card).
   - **Clear** (header or digest chrome): clears **search**, **selected tags**, and **removes or resets** the `localStorage` entry (single `clearAllFilters()`-style behaviour).
   - Optional UI: pills showing selected tags above the digest; each pill may offer a per-tag dismiss.

3. **Search and tags together (AND across stages)**

   - Apply **search** first (on `allCards`): if debounced query non-empty, replace candidates with Fuse results; if empty, candidates stay `allCards`.
   - Then apply **tags**: if selected set empty, do nothing; else keep only cards that match the OR rule above.
   - Net effect: **matches search (if any) AND matches tag rule (if any)**. Order matters for Fuse because the candidate set is “all cards” vs “Fuse hits only”.

4. **Idempotency and data**

   - Pipeline still produces exactly one daily edition; `published_at` idempotency unchanged (RFC-001).
   - Homepage SSR delivers the full digest once; filtering is **client-side only**.

5. **Performance**

   - Rebuild the Fuse index when `allCards` / digest data changes (`$derived` or equivalent — **no stale index**).
   - Tag stage: filter flat list (length of order of tens).

6. **Hydration**

   - `localStorage` is read **in the browser** after load. The first paint may show the **unfiltered** digest briefly until selection is applied — **acceptable for v1**.

## Out of scope

- **History / backfill / re-summarize:** no. Rows without `tags` are treated as **`[]`** in `+page.server.ts`. A separate RFC would cover historical editions or migrations.
- **Semantic (embedding) search** on the client.
- **Shift-click** or other multi-modifier tag gestures (superseded by the persistent multi-select set).

## File layout

```
apps/web/
├── .env.example
├── package.json                              ← fuse.js
├── src/
│   ├── lib/
│   │   ├── digest-filter.ts                  ← writable stores: searchQuery, debouncedSearchQuery, selectedTags; localStorage
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
└── Header.svelte                             ← $bindable searchQuery → GlobalSearch
```

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

Prompt JSON example must include the `tags` array line. Use **`FLASH_MODEL`** from `lib/server/digest/models.ts`.

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

**Client fallback:** when SSR returns an **empty** `digest`, [`+page.svelte`](../../apps/web/src/routes/+page.svelte) uses **`buildMockDigest()`** as `sourceDigest` so search/tags still work without `USE_MOCK_DATA`.

## 4. Shared client state (`lib/digest-filter.ts`)

**Implementation choice:** plain module with **Svelte `writable` stores** (not `$state` in a `.svelte.ts` file). Exported `$state` from a shared module cannot be assigned from plain functions under TypeScript, and **`bind:` cannot target a named import** of that state from `+layout.svelte`. Stores fix both: the layout uses **`bind:searchQuery={$searchQuery}`** (auto-subscription).

Exports:

- **`searchQuery`** — `writable('')`, two-way bound to header input
- **`debouncedSearchQuery`** — `writable('')`, updated from `searchQuery` via **`subscribe`** + **150 ms** `setTimeout` debounce (clear previous timer on each keystroke)
- **`selectedTags`** — `writable<string[]>`; initial value from **`localStorage`** key **`2min.today:selectedTags`** when `browser`; **`subscribe`** persists JSON on change
- **`toggleTag(tag)`** — `update` on `selectedTags`
- **`clearAllFilters()`** — resets both query stores, clears `selectedTags`, **`localStorage.removeItem`** when `browser`

**Homepage:** [`+page.svelte`](../../apps/web/src/routes/+page.svelte) **`subscribe`**s to `debouncedSearchQuery` and `selectedTags` inside **`$effect`**, copies into local **`$state`** (`debouncedQ`, `selTags`) so **`$derived.by`** for `filteredCards` re-runs when filters change.

## 5. Header wiring (`packages/ui` + `+layout.svelte`)

- **`GlobalSearch.svelte`:** `value = $bindable('')`, **`bind:value`** on the input; optional **`placeholder`** prop (app passes **`SEARCH DIGEST`**).
- **`Header.svelte`:** `searchQuery = $bindable('')`, **`searchPlaceholder`** prop forwarded to `GlobalSearch`.
- **`+layout.svelte`:** `import { searchQuery } from '$lib/digest-filter'` and **`<Header bind:searchQuery={$searchQuery} searchPlaceholder="SEARCH DIGEST" />`**.

## 6. Homepage UI and filtering (`routes/+page.svelte`)

Merged with the **existing** marquee / bucket layout. Implemented behaviour:

- **`sourceDigest`:** if `data.digest` has keys, use it; else **`buildMockDigest()`** (same shape as mock server path).
- **`allCards`:** flatten `sourceDigest` with **`Object.entries`** (each card already has **`bucket`** on the server; mock cards include it too).
- **`Fuse`:** `$derived` when `allCards` or **`data.fuseThreshold`** changes. **`bullets`** are searched via a **`getFn`** that **`join(' ')`**s the array (Fuse v7 does not treat `bullets[]` as text by default).
- **`filteredCards`:** read **`debouncedQ`** / **`selTags`** (mirrored from stores in **`$effect`**); search pass then tag pass; **`filteredDigest`** regroups by **`bucket`** using a local list reference after `if (!acc[b]) acc[b] = []` (no non-null assertion).
- **`liveToCategories(filteredDigest)`** with fixed **`bucketOrder`**.
- **Filter bar** when any filter active: selected-tag pills (click removes via **`toggleTag`**) + **Clear filters** (**`clearAllFilters`**).
- **Tiles:** tag **`button type="button"`**, **`aria-pressed`**, bottom-right; Tailwind / tokens, **no** border-radius on tag chrome.
- **`showFilteredEmpty`:** *No matches. Try broadening search or clearing tags.*

Illustrative core (abbreviated):

```svelte
<script lang="ts">
  import Fuse from 'fuse.js';
  import type { Bucket } from '$lib/config/buckets';
  import { buildMockDigest } from '$lib/mock-digest';
  import { debouncedSearchQuery, selectedTags } from '$lib/digest-filter';
  import type { DigestCard } from './+page.server';

  let debouncedQ = $state('');
  let selTags = $state<string[]>([]);

  $effect(() => {
    const u1 = debouncedSearchQuery.subscribe((v) => { debouncedQ = v; });
    const u2 = selectedTags.subscribe((v) => { selTags = v; });
    return () => { u1(); u2(); };
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
    const selectedSet = new Set(selTags);
    let results = allCards;
    const q = debouncedQ.trim();
    if (q) results = fuse.search(q).map((r) => r.item);
    if (selectedSet.size > 0) {
      results = results.filter((card) => card.tags.some((t) => selectedSet.has(t)));
    }
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

- **Zero results** after filters: copy above (search and/or tags).
- **Empty `tags` on a card:** render no tag controls for that tile.
- **Pipeline parse errors on `tags`:** treat as `[]` for that cluster; still persist headline / bullets / why when possible.
- **Invalid `DIGEST_FUSE_THRESHOLD`:** fallback `0.4`.
- **Tag identity:** matching and `localStorage` use the **exact** tag strings returned on cards (display and filter stay consistent).
- **`pnpm build` / CI:** the app may still import **`api/digest`** during SvelteKit analysis; a valid **Supabase URL** (and related env) may be required for production builds even when only the homepage changed — unrelated to RFC-002 filtering logic.
