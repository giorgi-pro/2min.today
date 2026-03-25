# RFC-004: Region Support — Assignment, Storage, and Client Filter

**Status:** Approved for Implementation  
**Date:** 2026-03-25  
**Author:** Project Owner  
**Depends on:** [RFC-001: Daily Digest Pipeline](0001-daily-digest-pipeline.md) · [RFC-002: Client-Side Global Search](0002-client-side-global-filtering.md)  
**Target files:** `apps/web/src/lib/types/digest.ts` · `apps/web/src/lib/pipeline/fetch.ts` · `apps/web/src/lib/pipeline/summarize.ts` · `apps/web/src/lib/pipeline/upsert.ts` · `apps/web/src/routes/+page.server.ts` · `apps/web/src/routes/+page.svelte` · `apps/web/src/lib/mock-data.ts` · `apps/web/src/lib/mock-digest.ts` · `apps/web/src/lib/digest-filter.ts` · `packages/ui/src/components/Menu.svelte` · `packages/ui/src/components/region/RegionSwitch.svelte` · `packages/ui/src/components/region/*Switch.svelte`

---

## Purpose

Add a `region` dimension to every digest card so users can filter the daily digest by geographic focus. Region is orthogonal to the existing topic bucket (World, Business, Tech…) — a card always has exactly one topic bucket and exactly one region.

---

## Region Taxonomy

Five regions are supported. `global` is the canonical fallback.

| Value | Meaning |
|-------|---------|
| `global` | Worldwide scope, or region is unclear / not one of the below |
| `europe` | Primarily Europe, EU, UK, Eastern Europe |
| `americas` | Latin America, Caribbean, Canada, or multi-country stories spanning the Americas |
| `middle-east` | Middle East and North Africa (MENA) |
| `usa` | United States domestic stories |

**`usa` vs `americas` rules (strict):**
- Story is primarily about the United States (domestic policy, US institutions, US cities) → `usa`
- Story explicitly involves the USA **plus** at least one other American country → `americas`
- Story is about a non-US country in the Americas (Venezuela, Brazil, Mexico, Canada, etc.) → `americas`
- Story is about a US foreign policy action *directed at another region* (e.g. US sanctions on Iran) → region of the *target* country, not `usa`

**Unmapped regions → `global`:**
- Asia, South/East Asia, Oceania, Sub-Saharan Africa (except where also MENA) → `global`
- Global institutions (UN, WHO, IMF, WTO) with no dominant regional focus → `global`
- Technology, science, and health stories with no primary geographic anchor → `global`

---

## Assignment Strategy: Hybrid (Feed Tagging + Gemini Inference)

### Tier 1 — Feed-Level Tagging (ground truth, no AI cost)

RSS feeds that publish geographically segmented editions are tagged at ingestion time. Every item from a tagged feed inherits its region and **skips Gemini region inference entirely**.

| Feed | Region tag |
|------|-----------|
| `reuters.com/world/europe/` | `europe` |
| `reuters.com/world/americas/` | `americas` |
| `reuters.com/world/middle-east/` | `middle-east` |
| `reuters.com/world/us/` | `usa` |
| `reuters.com/topNews`, `reuters.com/worldNews` | *(no tag — infer)* |
| AP, TechCrunch, Bloomberg, WSJ, X | *(no tag — infer)* |

The `feedRegion` field is added to `RawItem` and propagated through `EmbeddedItem` → `Cluster` → `SummarizedCluster` → `ClassifiedCluster`.

### Tier 2 — Gemini Inference (fallback for untagged items)

For clusters where `feedRegion` is absent, `region` is added to the Gemini structured output schema in `summarize.ts`. It is an enum field alongside `headline`, `bullets`, `whyItMatters`, `tags`. No extra API call — same `generateContent` invocation, ~10 additional output tokens per cluster.

**Prompt instruction added:**
```
"region": one of ["global","europe","americas","middle-east","usa"].
Assign "usa" only for US-domestic stories. Assign "americas" for multi-country
Americas stories or non-US Americas countries. Default to "global" if unclear.
```

**Validation:** if the model returns a value outside the enum, fall back to `global`. Never fail the pipeline on a bad region value.

### Priority

```
feedRegion (Tier 1) → if present, use it
                    → else use Gemini output (Tier 2), validated against enum
                    → fallback: "global"
```

---

## Type Changes

### `apps/web/src/lib/types/digest.ts`

```ts
export type Region = 'global' | 'europe' | 'americas' | 'middle-east' | 'usa';

export interface RawItem {
  // ...existing fields...
  feedRegion?: Region;  // set at fetch time for regionally-segmented feeds
}

export interface SummarizedCluster extends Cluster {
  // ...existing fields...
  region: Region;
}

export interface ClassifiedCluster extends SummarizedCluster {
  // ...existing fields (region inherited)...
}
```

### `apps/web/src/routes/+page.server.ts` — `DigestCard`

```ts
export type DigestCard = {
  // ...existing fields...
  region: Region;
};
```

---

## Pipeline Changes

### `fetch.ts`

Feed entries gain an optional `feedRegion`. The `RSS_FEEDS` array entries gain an optional `region?: Region` field. Items from tagged feeds set `feedRegion` on the `RawItem`; others leave it undefined.

### `summarize.ts`

Schema adds `region` as a `SchemaType.STRING` enum field in `required`. After parse, validate against the `VALID_REGIONS` set; if invalid, use the cluster's `feedRegion` if present, else `'global'`. The `feedRegion` from the cluster items takes priority over the model output.

### `upsert.ts`

`summary` jsonb gains `region`:

```ts
summary: {
  headline: c.headline,
  bullets: c.bullets,
  why_it_matters: c.whyItMatters,
  tags: c.tags,
  region: c.region,
},
```

### `+page.server.ts`

`SummaryJson` gains `region?: string`. Mapped to `DigestCard.region` with fallback to `'global'`.

---

## Client-Side Filter

Region filtering is a simple equality check applied **after** the existing search filter. `global` is a special value meaning "show all" — selecting the Globe icon shows the full digest regardless of card region.

### Filter logic

```
selected region = 'global' → show all cards
selected region = X        → show only cards where card.region === X
```

Applied in `filteredCards` in `+page.svelte`, after Fuse search results.

### State

`activeRegion` is added to `digest-filter.ts` as a custom store backed by `localStorage` under the key `region`. Rules:

- On init: read `localStorage.getItem('region')`. If the value is a valid non-`global` region, use it; otherwise default to `'global'`.
- On change to a non-`global` region: write to `localStorage`.
- On change to `'global'` (clear): remove the key from `localStorage` entirely — nothing is persisted.
- URL does not change. No query param, no hash fragment.
- SSR-safe: `localStorage` is only accessed in the browser (`typeof window !== 'undefined'`).

### Global switch behaviour

- `global` means "no filter active" — selecting it clears the active filter.
- The Globe icon is **not selectable** in the same sense as the other regions: it has no active/pressed state. It is purely a clear/reset affordance. Its visual style never shows the tomato outline.
- All other region switches (`europe`, `americas`, `middle-east`, `usa`) are mutually exclusive toggles. Selecting an already-active region has no effect (idempotent).

### `RegionSwitch` wiring

Each region switch (`GlobalSwitch`, `EuropeSwitch`, etc.) receives `active` and `onclick` props from `Menu`. `Menu` receives `activeRegion` and `onRegionChange` from `Header`. `Header` receives these as bindable props from `+layout.svelte`, which connects to the `activeRegion` store.

---

## Mock Data

`mock-data.ts` `NewsItem` gains a `region` field. Each mock item is assigned a region manually, consistent with its content. `buildMockDigest` passes `region` through to `MockDigestCard`.

---

## Supabase

No new top-level columns required if `region` lives inside the `summary` jsonb (consistent with `tags`). A future migration may promote `region` to a top-level indexed column for server-side filtering at scale.

---

## Out of Scope

- **Server-side region filtering** — digest is small enough for client-side filtering; future RFC if needed.
- **Multi-region cards** — each card has exactly one region.
- **Asia / Oceania / Sub-Saharan Africa as named regions** — collapsed to `global` for v1.
- **Region-segmented digests** — separate pipeline runs per region; future RFC.
- **URL-based region state** — intentionally not implemented; localStorage is sufficient and cleaner.
