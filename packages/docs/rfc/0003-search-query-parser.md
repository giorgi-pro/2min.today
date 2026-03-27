# RFC-003: Search Query Parser — Token Classification & Per-Token Fuse Strategy

**Status:** Approved for Implementation  
**Date:** 2026-03-25  
**Author:** Project Owner  
**Depends on:** [RFC-002: Client-Side Global Search](0002-client-side-global-filtering.md)  
**Target files:** `apps/web/src/lib/search/query-parser.ts` · `apps/web/src/routes/+page.svelte`

---

## Problem

RFC-002 passes the raw debounced string directly to Fuse.js with a single global threshold. This produces suboptimal results in three cases:

1. **Short trailing tokens** — typing `"india p"` searches the literal string `"india p"` rather than just `"india"`, degrading match quality.
2. **Numeric / code tokens** — `"2024"`, `"G7"`, `"UN"` need near-exact matching; the fuzzy threshold that works for prose words produces false positives for these.
3. **Noise tokens** — stop words (`"the"`, `"of"`) and single characters dilute the query.

The fix is a thin **query parser** that sits between raw input and Fuse, classifying each token and adjusting search strategy accordingly.

---

## Goals

- Sanitize and tokenize raw input before it reaches Fuse.
- Apply per-token rules so each token class gets the matching behaviour that makes sense for it.
- Keep the parser a pure function: `parseQuery(raw: string) → ParsedQuery` — easy to test, zero side effects.
- Remain backward-compatible with the existing Fuse index shape (no index changes).

---

## Token Classification Rules

### Step 1 — Sanitize

Strip characters that are not letters, digits, spaces, hyphens, or quotes. Collapse multiple spaces into one.

```
raw:       "india p!"
sanitized: "india p"
```

Preserve `"..."` double-quoted substrings as a single logical unit before splitting (see **Quoted phrases** below).

### Step 2 — Split

Split on whitespace. Quoted substrings extracted in Step 1 survive as single tokens with their internal spaces intact.

### Step 3 — Classify each token

Every token falls into exactly one class. Classification is checked in this priority order:

| Priority | Class | Rule | Fuse threshold | Example |
|----------|-------|------|---------------|---------|
| 1 | `quoted-phrase` | Wrapped in `"…"` after sanitize | `0.1` (near-exact) | `"climate change"` |
| 2 | `stop-word` | Token (lowercased) is in stop-word list | **Drop** (skip entirely) | `the`, `and`, `of`, `in`, `a` |
| 3 | `too-short` | Length ≤ 1 after stripping quotes | **Drop** | `p`, `i` |
| 4 | `numeric` | Contains at least one digit | `0.1` (near-exact) | `2024`, `COVID-19`, `G20` |
| 5 | `acronym` | All uppercase, length 2–4, no digits | `0.15` (tight) | `US`, `EU`, `UN`, `NATO` |
| 6 | `short-word` | Length = 2, not acronym, not stop-word | **Drop** | `in`, `at`, `be` (if not caught by stop-word list) |
| 7 | `word` | Everything else (length ≥ 3, mixed/lower case) | inherits global `fuseThreshold` from `data.fuseThreshold` | `india`, `climate` |

### Step 4 — Build search string

Drop all `stop-word`, `too-short`, and `short-word` tokens. Join surviving tokens with a space. If the result is empty, return `null` — no search is performed, the full digest is shown.

---

## Detailed Class Behaviour

### `quoted-phrase`

User intent: exact or near-exact match of a multi-word expression.

- Strip the surrounding quotes after extraction.
- Pass to Fuse as a single token with threshold `0.1`.
- Example: `"climate change"` → one Fuse search term, tight threshold.

### `numeric`

User intent: match a specific year, number, identifier, or alphanumeric code.

- Includes mixed tokens like `COVID-19`, `G7`, `F-35`, `2024`.
- Use threshold `0.1` — a user typing `2024` almost certainly wants only stories mentioning `2024`, not fuzzy neighbours.
- The hyphen is preserved (strip only truly punctuation-only characters in Step 1, not hyphens inside tokens).

### `acronym`

User intent: match a known abbreviation or geopolitical entity.

- All-uppercase, 2–4 characters, no digits.
- Use threshold `0.15` — tighter than prose but slightly looser than numeric to handle common variants (`UK` / `U.K.`).
- These would otherwise be dropped by `short-word` rules; they are explicitly rescued here.

### `word`

Normal prose token, length ≥ 3.

- Uses the global `fuseThreshold` value (`data.fuseThreshold`, default `0.4`) — same behaviour as RFC-002 baseline.
- This is the common case.

### Dropped classes

`stop-word`, `too-short`, `short-word` are silently removed. The user sees no error; the digest simply reflects the surviving tokens.

---

## Stop-Word List (initial)

A minimal English list sufficient for news digest queries. Not exhaustive — the goal is noise reduction, not full NLP.

```
a an the and or but of in on at to for is are was were be been
it its this that these those with from by about as into through
```

The list lives as a `Set<string>` in `query-parser.ts`. It can be extended without changing the classification logic.

---

## Architecture: Pipeline + Strategy

The implementation uses two complementary patterns to keep orchestration declarative and execution swappable.

### Pipeline (parsing)

Parsing is a list of named `Transform` functions. Each transform takes a `Token[]` and returns a `Token[]`. The pipeline is composed declaratively — adding a rule means appending one entry to the array, not editing existing logic.

```ts
type Transform = (tokens: Token[]) => Token[]

const pipeline: Transform[] = [
  sanitize,
  extractQuotedPhrases,
  splitIntoTokens,
  dropStopWords,
  dropTooShort,
  classifyNumeric,
  classifyAcronym,
  classifyWord,
]
```

`runPipeline(raw, pipeline)` folds the raw string through each transform in order and produces a `ParsedQuery | null` (null when all tokens are dropped).

Each transform is a focused, pure, independently testable function. The pipeline array is the authoritative "table of contents" for what parsing does and in what order.

### Strategy (execution)

Once the query is parsed, *how* we search is a separate concern. A `SearchStrategy` interface decouples query parsing from Fuse execution:

```ts
interface SearchStrategy {
  search(parsed: ParsedQuery, cards: CardRow[]): CardRow[]
}
```

v1 implements `ThresholdStrategy` (Option A — strictest surviving threshold applied to the full joined string). Future strategies (e.g. Fuse `$and` per-token logical queries) can be swapped in by changing one constructor argument.

### `SearchHandler`

The handler composes the pipeline and a strategy. Its public API is a single method:

```ts
class SearchHandler {
  constructor(
    private pipeline: Transform[],
    private strategy: SearchStrategy,
  ) {}

  handle(raw: string, cards: CardRow[]): CardRow[] {
    const parsed = runPipeline(raw, this.pipeline)
    if (!parsed) return cards
    return this.strategy.search(parsed, cards)
  }
}
```

`+page.svelte` calls `handler.handle(debouncedQ, allCards)` — one call, no parsing logic in the component.

### Why not Builder or Strategy alone?

**Strategy** alone would mean swapping the entire algorithm. Here only the *execution* step varies; the parsing pipeline is stable and additive. **Builder** (`new QueryParser().withStopWords()...build()`) adds construction overhead when an ordered array of functions already expresses the same thing more directly. The **Pipeline + Strategy** split maps cleanly onto the two distinct concerns: *what tokens survive and how are they classified* vs *how do we turn those tokens into search results*.

---

## Multi-Token Threshold Resolution (v1)

`ThresholdStrategy` uses the strictest threshold among all surviving tokens:

| Surviving token classes | Applied threshold |
|-------------------------|-------------------|
| Any `quoted-phrase` or `numeric` present | `0.1` |
| Any `acronym` present (no numeric/quoted) | `0.15` |
| All `word` tokens | global `fuseThreshold` (`data.fuseThreshold`, default `0.4`) |

Future options deferred to a later RFC:
- **Option B** — one Fuse search per token, intersect results
- **Option C** — Fuse `$and` logical query with per-token threshold control

---

## Types

```ts
export type TokenClass = 'quoted-phrase' | 'numeric' | 'acronym' | 'word';

export interface Token {
  text: string;
  class: TokenClass;
  threshold: number;
}

export interface ParsedQuery {
  tokens: Token[];
  searchString: string;
  threshold: number;
}
```

---

## Integration with `+page.svelte`

Before (RFC-002 baseline):

```ts
const filteredCards = $derived.by(() => {
  const tokens = debouncedQ.trim().split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return allCards;
  return fuse.search(tokens.join(' ')).map((r) => r.item);
});
```

After RFC-003:

```ts
const filteredCards = $derived.by(() => handler.handle(debouncedQ, allCards));
```

The `handler` is a module-level constant — constructed once with the default pipeline and `ThresholdStrategy`. The Fuse index is built inside the strategy and keyed on the resolved threshold, so it is only rebuilt when the threshold class changes (rare), not on every keystroke.

---

## Out of Scope (this RFC)

- **Operator/prefix tokens** — `tag:economy`, `source:reuters`. Structured field filtering is a future RFC.
- **Fuse `$and` / per-token logical queries** (Option C above).
- **Stemming / lemmatization** — `"running"` ≠ `"run"` for now. Fuse's fuzzy matching covers most practical cases.
- **Language detection** — stop-word list is English-only for v1.
- **Semantic / embedding search** — explicitly out of scope per RFC-002.

---

## File Layout

```
apps/web/src/lib/search/
├── query-parser.ts     ← Token types, Transform type, all pipeline transforms, runPipeline
└── search-handler.ts   ← SearchStrategy interface, ThresholdStrategy, SearchHandler, default export
```

No new environment variables. No pipeline changes. No Supabase changes.

---

## Acceptance Criteria

| Input | Expected behaviour |
|-------|--------------------|
| `"india p"` | Searches `"india"` only; `p` dropped (too-short) |
| `"the war"` | Searches `"war"` only; `the` dropped (stop-word) |
| `"2024 election"` | Searches `"2024 election"` with threshold `0.1` |
| `"US economy"` | Searches `"US economy"` with threshold `0.15` |
| `"climate change"` (quoted) | Searches `"climate change"` as one token, threshold `0.1` |
| `"a in of"` | All dropped → no search, full digest shown |
| `"G7 summit 2024"` | Numeric wins → threshold `0.1`; `summit` included |
| `"p"` | Dropped → no search |
