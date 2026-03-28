# RFC-006: Source Credits

**Status:** Approved for Implementation
**Date:** 2026-03-26
**Author:** Project Owner
**Depends on:** RFC-001 (Daily Digest Pipeline)
**Target files:**

- `apps/web/src/lib/types/digest.ts` — add `Credit` interface, type `sources` on `SummarizedCluster`
- `apps/web/src/lib/pipeline/summarize.ts` — populate `sources` from cluster items
- `apps/web/src/lib/pipeline/upsert.ts` — persist `sources` inside `summary` jsonb
- `apps/web/src/routes/+page.server.ts` — type `DigestCard.credits` correctly, parse from DB
- `apps/web/src/lib/mock-digest.ts` — type `MockDigestCard.credits`
- `apps/web/src/lib/mock-data.ts` — add `credits` to mock `NewsItem`
- `apps/web/src/routes/+page.svelte` — pass `credits` through
- `packages/ui/src/components/digest/CategoryRow.svelte` — pass `credits` through
- `packages/ui/src/components/digest/NewsCard.svelte` — replace `source` string with `©` toggle + dropdown

---

## Purpose

Replace the single source label (e.g. "Reuters") on each news card with a `©` symbol that toggles a dropdown listing every source URL the story was aggregated from. This:

1. Keeps the card view clean — no third-party brand names visible by default
2. Gives full, accurate credit to all sources (a cluster may aggregate 4–8 outlets)
3. Prevents premature click-away — links are behind a deliberate interaction
4. Fits naturally within the existing brutalist design system

---

## Data Model

### New type: `Credit`

```ts
export interface Credit {
  source: string; // display name, e.g. "Reuters"
  url: string; // original article URL
}
```

Added to `lib/types/digest.ts`. Replaces the loosely-typed `sources: unknown[]` that already exists throughout the stack.

### Updated interfaces

`SummarizedCluster` gains a `credits` field (populated in `summarize.ts`):

```ts
export interface SummarizedCluster extends Cluster {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  region: Region;
  credits: Credit[]; // ← new; derived from cluster.items, not from Gemini
}
```

`ClassifiedCluster` inherits `credits` transitively.

`DigestCard` in `+page.server.ts` replaces `sources: unknown[]` with `credits: Credit[]`.

---

## 1. Pipeline: Populating Credits (`lib/pipeline/summarize.ts`)

Credits are derived from the raw cluster items — **no Gemini call needed**. Each item already has `source` (display name) and `url` (original link). Deduplication by URL, preserving order of first occurrence.

```ts
function extractCredits(items: EmbeddedItem[]): Credit[] {
  const seen = new Set<string>();
  const credits: Credit[] = [];
  for (const item of items) {
    if (item.url && !seen.has(item.url)) {
      seen.add(item.url);
      credits.push({ source: item.source, url: item.url });
    }
  }
  return credits;
}
```

Added to each `SummarizedCluster` in the existing `summarizeClusters` loop:

```ts
results.push({
  ...cluster,
  headline: parsed.headline,
  bullets: parsed.bullets.slice(0, 3),
  whyItMatters: parsed.whyItMatters,
  tags: normalizeSummaryTags(parsed.tags),
  region: feedRegion ?? parseRegion(parsed.region),
  credits: extractCredits(cluster.items), // ← new
});
```

---

## 2. Pipeline: Persisting Credits (`lib/pipeline/upsert.ts`)

`credits` is written into the existing `summary` jsonb column alongside `headline`, `bullets`, etc. No schema migration needed.

```ts
summary: {
  headline: c.headline,
  bullets: c.bullets,
  why_it_matters: c.whyItMatters,
  tags: c.tags,
  region: c.region,
  credits: c.credits,   // ← new; Credit[] stored as jsonb array
},
```

---

## 3. Homepage Read (`+page.server.ts`)

`SummaryJson` gains `credits`. `DigestCard.sources: unknown[]` is replaced by `DigestCard.credits: Credit[]`.

```ts
type SummaryJson = {
  headline: string;
  bullets: string[];
  why_it_matters: string;
  credits?: { source: string; url: string }[];
  tags?: unknown;
  region?: unknown;
};

export type DigestCard = {
  // ...existing fields...
  credits: Credit[]; // replaces sources: unknown[]
};
```

Parsing:

```ts
credits: Array.isArray(s.credits)
  ? s.credits.filter((c): c is Credit => typeof c?.source === 'string' && typeof c?.url === 'string')
  : [],
```

---

## 4. Mock Data

`NewsItem` in `mock-data.ts` gains an optional `credits?: Credit[]` field. Existing items can omit it; `buildMockDigest` defaults to `[]`.

A few representative mock items should include credits to make the UI testable:

```ts
credits: [
  { source: 'Reuters', url: 'https://reuters.com/world/example' },
  { source: 'AP', url: 'https://apnews.com/article/example' },
],
```

---

## 5. UI: `©` Toggle Dropdown (`packages/ui/src/components/digest/NewsCard.svelte`)

### Behaviour

- The `source` string prop is **removed**. `credits: Credit[]` is added.
- A `©` symbol sits in the top-right corner of the card (where the source label was).
- Clicking it toggles an overlay dropdown listing all credits.
- The dropdown is **fixed max-height**, scrollable, positioned absolute within the card (which gets `position: relative`).
- Clicking outside or clicking `©` again closes it.
- If `credits` is empty, the `©` symbol is still shown but the dropdown renders a fallback "Source unavailable" line.

### Visual Language

Stays within the design system:

- `©` in `font-mono text-[0.55rem] tracking-widest`, same style as the old source label — `text-black/40` for normal cards, `text-[#637588]/60` for live cards
- Dropdown: `bg-white border border-black/10` background, `max-h-40 overflow-y-auto`
- Each credit row: source name in `font-mono text-[0.55rem] uppercase tracking-widest text-black/50`, URL as a plain `<a>` in `text-[0.7rem] text-black/70 underline-offset-2 hover:text-black`
- No rounded corners, no shadows — consistent with the "no-line, tonal" design rules

### Prop changes

```ts
type Props = {
  title: string;
  bullets: string[];
  whyItMatters: string;
  credits: Credit[]; // replaces source: string
  isBreaking: boolean;
  isLive: boolean;
  tags: string[];
};
```

### Sketch

```
┌─────────────────────────────────┐
│ ● (breaking dot, if any)    ©   │  ← © toggles dropdown
│                                 │
│ Headline text here              │
│ • Bullet one                    │
│ • Bullet two                    │
│ • Bullet three                  │
│─────────────────────────────────│
│ WHY IT MATTERS                  │
│ Italic explanation              │
│ [tag] [tag]                     │
└─────────────────────────────────┘

When © is clicked:
┌─────────────────────────────────┐
│ ● (breaking dot, if any)    ©▾  │
│                    ┌────────────┤
│                    │ REUTERS    │
│                    │ https://.. │
│                    │ AP         │
│                    │ https://.. │
│                    │ BLOOMBERG  │
│                    │ https://.. │
│                    └────────────┤
│─────────────────────────────────│
│ WHY IT MATTERS                  │
```

---

## 6. Prop Threading

The `credits` array flows unchanged through the full chain:

```
mock-data.ts (Credit[])
  → mock-digest.ts (MockDigestCard.credits)
    → +page.server.ts (DigestCard.credits)
      → +page.svelte (Category.news[].credits)
        → CategoryRow.svelte (NewsItem.credits)
          → NewsCard.svelte (props.credits)
```

`CategoryRow`'s `NewsItem` type gains `credits: Credit[]`, replacing the now-unused `source: string`.

---

## 7. Live Cards

Live cards (`isLive: true`) currently show `source` in the header. With this change, they show `©` in the same position — same toggle behaviour, same dropdown — but the `©` and dropdown text use the Slate color palette (`text-[#637588]/60`) to match the live card treatment.

---

## 8. Breaking Pipeline (`lib/pipeline/breaking/upsert.ts`)

Live stories written by the breaking pipeline also need credits. The `BreakingCandidate` already has `url` and `source`. `upsertLiveStory` should write a single-item credits array:

```ts
summary: {
  headline: card.headline,
  bullets: card.bullets,
  why_it_matters: '',
  credits: [{ source: candidate.source, url: candidate.url }],
},
```

---

## 9. What Does Not Change

- The `summary` jsonb column shape is extended, not replaced — old rows without `credits` gracefully default to `[]` via the null-safe parse in §3.
- No DB migration needed.
- `isBreaking`, `isLive`, `tags`, `region` are unaffected.
- The `source` field is removed from `NewsCard` props only — it is not removed from `RawItem` or `EmbeddedItem` (still needed for credit extraction in the pipeline).

---

## References

- RFC-001 §5 (`upsert.ts`) — `summary` jsonb shape
- RFC-005 §5 (`upsert.ts`) — live story persistence
- Design system (`apps/web/DESIGN.md`) — no rounded corners, no shadows, ghost border rule
