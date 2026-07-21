# Digest Pipeline Flow

End-to-end walkthrough of what happens when the daily digest runs — from HTTP request to homepage render.

---

## Triggering the pipeline

The digest is triggered by a cron job in production, but you can run it manually in dev:

```bash
curl "http://localhost:3000/api/digest?secret=${CRON_SECRET}"
```

`curl` blocks until the handler returns. There is no streaming — the terminal shows nothing while the pipeline runs, then prints the final JSON response.

---

## Step 0 — Handler (`routes/api/digest/+server.ts`)

Before touching the pipeline, the handler does three things:

1. **Auth check** — compares `?secret=` to `CRON_SECRET`. Returns `401` if wrong.
2. **Idempotency check** (`runDigestCron` in `@services`) — queries Postgres for any `clusters` row with `published_at` inside today's UTC window (`00:00:00Z … 23:59:59Z`). If one exists, returns immediately:
   ```json
   { "status": "already-run-today" }
   ```
3. **Pipeline handoff** — calls `await pipeline.run(db, { log })` and waits. The handler does not respond until `pipeline.run` resolves or throws.

Logging uses **Pino** (`logger`). Every run gets a unique `runId` (UUID) attached to a child logger that flows through all pipeline phases. Set `LOG_LEVEL` and `LOG_PRETTY` in `.env` to control verbosity and format (see `.env.example`).

---

## Step 1 — Fetch (`lib/pipeline/fetch.ts`)

All sources are RSS, defined in `packages/config/app/news-sources.yaml`. Each entry has an `enabled` flag — toggle sources without code changes — and an optional `region` hint (forces every story from that feed to a fixed region; see Step 4).

Sources are fetched in parallel with `Promise.all`. Each source:

- Sends an HTTP GET with a 10-second `AbortSignal` timeout.
- Parses XML with `fast-xml-parser` (entity-expansion limits raised above the library default — some large reputable feeds like Guardian World otherwise trip the default cap).
- Extracts per-item: `title`, `content` (prefers `content:encoded` → `content` → `description`, HTML-stripped, sliced to 800 chars), `url`, `published`, `source` label, and `feedRegion` if the source has a `region` hint.

After all sources resolve, **URL-level dedup** removes items with the same `id` (the item URL or GUID), keeping the first occurrence. Failed sources log an error and contribute zero items — they do not abort the run.

Output: `RawItem[]` (typically a few hundred items across ~12 enabled feeds on a normal day).

---

## Step 2 — Embed (`lib/pipeline/embed.ts`)

Each `RawItem` needs a vector embedding so stories can be compared by meaning.

- Model: `EMBEDDING_MODEL` env (default `gemini-embedding-2-preview`).
- Dimension: `EMBEDDING_DIMENSION` env (default `768`; must match the `vector(N)` column in `packages/data/schema.sql`).
- Items are sent in **batches of 20**, with each batch run in parallel via `Promise.all`. Batches are sequential — batch N+1 starts only after batch N finishes.
- Embedding input per item: `"{title}\n{content}"` (content already capped at 800 chars from fetch).

Output: `EmbeddedItem[]` — every `RawItem` plus a `number[]` embedding vector.

> **Why embeddings can be slow:** the free-tier embedding quota is shared across your entire project. With ~300 items that's 15 batches of 20 parallel calls. If you've recently used the API for other purposes, you may hit the RPM cap mid-batch.

---

## Step 3 — Cluster (`lib/pipeline/cluster.ts`)

Groups items that cover the same story into clusters. This step is **entirely in-memory** — no DB access.

**Algorithm:** greedy single-linkage by cosine similarity.

For each item in order:

1. Compute cosine similarity between the item's embedding and each existing cluster's **centroid** embedding.
2. If the best similarity ≥ **`CLUSTER_SIMILARITY_THRESHOLD`** (env, **0–1**, **default 0.85**), add the item to that cluster and recompute the centroid as the mean of all member embeddings.
3. Otherwise, start a new single-item cluster.

The default **0.85** is deliberately high — it groups "Fed raises rates" from BBC, Guardian, and NPR into one cluster while keeping "Fed raises rates" and "Tech layoffs" apart. Lower the env var to merge more aggressively when cluster counts are too high.

Output: `Cluster[]` — commonly 60–100 clusters from a full day's feed with the current 12-source set.

---

## Step 4 — Summarize (`lib/pipeline/summarize.ts`)

One Flash `generateContent` call per cluster. This is the slowest phase.

**Cap:** if `DIGEST_SUMMARIZE_MAX_CLUSTERS` is set (positive int), only the first N clusters are summarized — useful for debugging without waiting for the full run.

**Model config:** uses `FLASH_MODEL` (default `gemini-flash-latest`) with `mergeFlashGenerationConfig`, which applies optional env overrides:

- `FLASH_GENERATION_TEMPERATURE` — sampling temperature.
- `FLASH_THINKING_BUDGET` — token thinking budget (Gemini 2.5-era models; `0` = minimal, `-1` = dynamic).
- `FLASH_THINKING_LEVEL` — `MINIMAL | LOW | MEDIUM | HIGH` (Gemini 3+ style; may error on 2.5-era models).

**Prompt asks Flash to return structured JSON:**

- `headline` — max 12 words.
- `bullets` — exactly 3 bullets, max 25 words each.
- `whyItMatters` — max 30 words.
- `tags` — 3–5 short-phrase keywords (e.g. `fed-rate`, `nvidia-chip`), normalized and capped at 5.
- `region` — one of `usa | europe | middle-east | americas | asia | africa | world` — **where** the story takes place. If the source feed has a `region` hint (`feedRegion`), that wins outright and the LLM's answer is discarded.
- `topic` — one of `politics | conflict | business | tech | science | health | environment | society` — **what** the story is about. This is only a *hint* (`llmTopic`); the actual topic assignment happens in Step 5.

Region and topic are independent — the prompt explicitly tells the model to assign both, not to pick one merged category.

**Flash pacing — two modes** (controlled by `FLASH_GENERATION_MIN_INTERVAL_MS`):

| Mode                  | When                                     | Behaviour                                                                                                                                                                                            |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UnconstrainedFlow** | env unset or empty                       | Each call runs immediately, once. No 429 retry. Use with billing or high RPM.                                                                                                                        |
| **ConstrainedFlow**   | env set to a positive int (e.g. `15000`) | Enforces a minimum gap between call _starts_ (ms). On 429: exponential backoff up to 12 attempts, honouring the API's `retry in Ns` hint. `15000` ≈ 4 RPM, safely under the free-tier 5 RPM ceiling. |

> **Why this feels "infinite":** with ConstrainedFlow at 15s and 80 clusters, summarize alone takes ≥ 80 × 15s = **20 minutes** minimum, plus actual API latency on each call. Unset the interval (UnconstrainedFlow) if you have billing enabled and want fast local iteration.

Output: `SummarizedCluster[]` — cluster + `headline`, `bullets`, `whyItMatters`, `tags`, `region` (final), `credits` (deduplicated source URLs from member items), `llmTopic` (hint, or `null` if Gemini returned something unrecognized).

---

## Step 5 — Classify (`lib/pipeline/classify.ts`)

Assigns each cluster's final **topic** (region was already finalized in Step 4). See [`how-classification-works.md`](./how-classification-works.md) for the full decision tree.

**Setup:** loads all rows from the `topic_anchors` Postgres table — pre-embedded anchor phrases for each of the 8 topics, seeded via `packages/scripts/seed-topic-anchors.ts`. Throws if the table is empty.

**Per cluster:**

1. Compute cosine similarity between the cluster's **centroid** embedding and each topic anchor embedding; take the best match (`bestTopic`, `bestSim`).
2. Compare `bestSim` to **`CLASSIFY_SIMILARITY_THRESHOLD`** (env, `0`–`1`, default `0.65`).
   - **At or above threshold** → use `bestTopic` (the anchor match).
   - **Below threshold** → use `cluster.llmTopic` if Gemini returned a valid one in Step 4, otherwise fall back to `bestTopic` anyway (closest anchor, even if not confident).

Output: `ClassifiedCluster[]` — every cluster now has a final `topic` (region was already set).

---

## Step 6 — Upsert (`lib/pipeline/upsert.ts`)

Writes the digest to Postgres atomically within today's UTC window, inside a single transaction.

1. **Delete** all existing `clusters` rows where `published_at` is in today's UTC window. This ensures a clean slate if the handler's idempotency check was bypassed or a partial run left stale rows.
2. **Insert** all classified clusters (with an `on conflict (id) do update` for safety). Each row contains:
   - `id` — UUID (assigned during clustering).
   - `embedding` — centroid vector.
   - `raw_items` — full array of source items (jsonb).
   - `summary` — `{ headline, bullets, why_it_matters, tags, region, credits }` (jsonb).
   - `region` — final region column.
   - `topic` — final topic column.
   - `published_at` — current timestamp.
3. **Commit**, or **rollback** the whole batch on any error.

Output: the same `ClassifiedCluster[]` passed in; throws on a Postgres error (rolling back first).

---

## Final response

When `pipeline.run` resolves, the handler logs total wall-clock duration and returns:

```json
{ "status": "success", "clustersCreated": N }
```

On error:

```json
{ "status": "error", "message": "..." }
```

---

## Homepage render

The homepage is **client-side rendered for its digest content** (not SSR) so a repeat visit can paint instantly from a `localStorage` cache. The flow:

1. `+page.server.ts` (SSR) returns only cheap, DB-free config — `fuseThreshold` and `useMockData` from env. No Postgres access here.
2. `+page.svelte`, on mount, reads a `localStorage` cache keyed by today's UTC date. If present, it renders immediately.
3. Regardless of cache hit, it fetches `GET /api/digest/data` in the background. That endpoint calls the same `loadHomePageDigest()` service used everywhere else, which:
   - Queries `clusters` for rows in today's UTC window, ordered by `published_at` descending.
   - **Backfills each topic toward a minimum of 5 cards** using the most recent older rows if today's news alone doesn't reach it (`MIN_CARDS_PER_TOPIC` in `home-page-load.ts`).
   - Is wrapped in an **in-memory cache keyed by the latest `published_at` in `clusters`**, so requests skip the DB entirely until a new digest run actually writes. On a DB error, it serves the last good cached value instead of an empty page. See [`how-caching-works.md`](./how-caching-works.md).
4. The fetch response updates the page and refreshes the `localStorage` cache for next time.

The 8 homepage rows (`TOPIC_ORDER` in `@2min.today/types`) are the **topics**: `politics`, `conflict`, `business`, `tech`, `science`, `health`, `environment`, `society`. **Region** is not a row — it's a header filter that narrows cards across all rows client-side.

---

## Timing reference

Rough estimates for a typical day (~300 raw items, ~80 clusters, free-tier Gemini):

| Phase                             | Typical duration                      |
| --------------------------------- | -------------------------------------- |
| Fetch                             | 5–15 s (parallel network)              |
| Embed                             | 30–90 s (15 batches × parallel calls)  |
| Cluster                           | < 1 s (in-memory)                      |
| Summarize (ConstrainedFlow 15 s)  | 15–25 min                              |
| Summarize (UnconstrainedFlow)     | 1–3 min                                |
| Classify                          | 5–30 s                                 |
| Upsert                            | 1–3 s                                  |

The **total wall time** is dominated by summarize. If the `curl` call appears to hang, it is almost certainly waiting on Flash calls — not stuck. If you have billing enabled, leave `FLASH_GENERATION_MIN_INTERVAL_MS` unset for a much faster local iteration loop.

---

## Useful env vars at a glance

| Variable                           | Default                      | Effect                                                                                          |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `CRON_SECRET`                       | —                             | Protects `/api/digest` and `/api/digest/sources`                                                  |
| `DATABASE_URL`                      | —                             | Standard libpq connection string (Postgres + pgvector)                                            |
| `LOG_LEVEL`                         | `info`                        | Pino log level (`debug` shows per-batch and per-cluster lines)                                    |
| `LOG_PRETTY`                        | auto                          | `1`/`true` = pretty; `0`/`false` = JSON; unset = pretty in dev, JSON in prod                       |
| `FLASH_MODEL`                       | `gemini-flash-latest`         | Flash model for summarize (region + topic hint)                                                   |
| `FLASH_GENERATION_MIN_INTERVAL_MS`  | unset                         | Unset = UnconstrainedFlow; positive int (e.g. `15000`) = ConstrainedFlow                           |
| `FLASH_GENERATION_TEMPERATURE`      | unset                         | Sampling temperature override                                                                      |
| `FLASH_THINKING_BUDGET`             | unset                         | Gemini 2.5-era thinking token budget                                                               |
| `EMBEDDING_MODEL`                   | `gemini-embedding-2-preview`  | Embedding model                                                                                    |
| `EMBEDDING_DIMENSION`               | `768`                         | Must match `vector(N)` in `packages/data/schema.sql`                                               |
| `CLUSTER_SIMILARITY_THRESHOLD`      | `0.85`                        | Item-to-centroid merge cutoff; lower → fewer clusters                                              |
| `CLASSIFY_SIMILARITY_THRESHOLD`     | `0.65`                        | Anchor-match cutoff: below → fall back to the LLM's topic guess                                    |
| `DIGEST_SUMMARIZE_MAX_CLUSTERS`     | unset                         | Cap Flash calls for debugging                                                                      |
| `DIGEST_FUSE_THRESHOLD`             | `0.25`                        | Homepage search fuzziness (Fuse.js)                                                                |
| `USE_MOCK_DATA`                     | `false`                      | `true` makes `GET /api/digest/data` return static mock cards instead of querying Postgres           |
