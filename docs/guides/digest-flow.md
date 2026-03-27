# Digest Pipeline Flow

End-to-end walkthrough of what happens when the daily digest runs — from HTTP request to homepage render.

---

## Triggering the pipeline

The digest is triggered by a Vercel cron job, but you can run it manually in dev:

```bash
curl "http://localhost:3000/api/digest?secret=${CRON_SECRET}"
```

`curl` blocks until the handler returns. There is no streaming — the terminal shows nothing while the pipeline runs, then prints the final JSON response.

---

## Step 0 — Handler (`routes/api/digest/+server.ts`)

Before touching the pipeline, the handler does three things:

1. **Auth check** — compares `?secret=` to `CRON_SECRET`. Returns `401` if wrong.
2. **Idempotency check** — queries Supabase for any `clusters` row with `published_at` inside today's UTC window (`00:00:00Z … 23:59:59Z`). If one exists, returns immediately:
   ```json
   { "status": "already-run-today" }
   ```
3. **Pipeline handoff** — calls `await pipeline.run(supabase, { log })` and waits. The handler does not respond until `pipeline.run` resolves or throws.

Logging uses **Pino** (`digestLogger`). Every run gets a unique `runId` (UUID) attached to a child logger that flows through all pipeline phases. Set `LOG_LEVEL` and `LOG_PRETTY` in `.env` to control verbosity and format (see `.env.example`).

---

## Step 1 — Fetch (`lib/pipeline/fetch.ts`)

All sources are defined in `lib/config/news-sources.yaml`. Each entry has a `type` (`rss` or `x`) and an `enabled` flag — toggle sources without code changes.

**RSS sources** are fetched in parallel with `Promise.all`. Each source:
- Sends an HTTP GET with a 10-second `AbortSignal` timeout.
- Parses XML with `fast-xml-parser`.
- Extracts per-item: `title`, `content` (prefers `content:encoded` → `content` → `description`, HTML-stripped, sliced to 800 chars), `url`, `published`, `source` label, and optional `feedRegion`.

**X sources** (when enabled and `X_BEARER_TOKEN` is set) run a `v2.search` query filtered to recent tweets (`since_days`) sorted by relevancy.

After all sources resolve, **URL-level dedup** removes items with the same `id` (the item URL or GUID), keeping the first occurrence. Failed sources log an error and contribute zero items — they do not abort the run.

Output: `RawItem[]` (~60–150 items on a normal day).

---

## Step 2 — Embed (`lib/pipeline/embed.ts`)

Each `RawItem` needs a vector embedding so stories can be compared by meaning.

- Model: `EMBEDDING_MODEL` env (default `gemini-embedding-2-preview`).
- Dimension: `EMBEDDING_DIMENSION` env (default `768`; must match the `vector(N)` column in your Supabase migration).
- Items are sent in **batches of 20**, with each batch run in parallel via `Promise.all`. Batches are sequential — batch N+1 starts only after batch N finishes.
- Embedding input per item: `"{title}\n{content}"` (content already capped at 800 chars from fetch).

Output: `EmbeddedItem[]` — every `RawItem` plus a `number[]` embedding vector.

> **Why embeddings can be slow:** the free-tier embedding quota is shared across your entire project. 100 items = 5 batches of 20 parallel calls. If you've recently used the API for other purposes, you may hit the RPM cap mid-batch.

---

## Step 3 — Cluster (`lib/pipeline/cluster.ts`)

Groups items that cover the same story into clusters. This step is **entirely in-memory** — no DB access.

**Algorithm:** greedy single-linkage by cosine similarity.

For each item in order:
1. Compute cosine similarity between the item's embedding and each existing cluster's **centroid** embedding.
2. If the best similarity ≥ **`CLUSTER_SIMILARITY_THRESHOLD`** (env, **0–1**, **default 0.85**), add the item to that cluster and recompute the centroid as the mean of all member embeddings.
3. Otherwise, start a new single-item cluster.

The default **0.85** is deliberately high — it groups "Fed raises rates" from Reuters, AP, and Bloomberg into one cluster while keeping "Fed raises rates" and "Tech layoffs" apart. Lower the env var to merge more aggressively when cluster counts are too high.

Output: `Cluster[]` — typically 15–35 clusters from a full day's feed.

---

## Step 4 — Summarize (`lib/pipeline/summarize.ts`)

One Flash `generateContent` call per cluster. This is the slowest phase.

**Cap:** if `DIGEST_SUMMARIZE_MAX_CLUSTERS` is set (positive int), only the first N clusters are summarized — useful for debugging without waiting for the full run.

**Model config:** uses `FLASH_MODEL` (default `gemini-2.5-flash`) with `mergeFlashGenerationConfig`, which applies optional env overrides:
- `FLASH_GENERATION_TEMPERATURE` — sampling temperature.
- `FLASH_THINKING_BUDGET` — token thinking budget (Gemini 2.5; `0` = minimal, `-1` = dynamic).
- `FLASH_THINKING_LEVEL` — `MINIMAL | LOW | MEDIUM | HIGH` (Gemini 3+ style; may error on 2.5).

**Prompt asks Flash to return structured JSON:**
- `headline` — max 12 words.
- `bullets` — exactly 3 bullets, max 25 words each.
- `whyItMatters` — max 30 words.
- `tags` — 3–5 short-phrase keywords (e.g. `fed-rate`, `nvidia-chip`), normalized and capped at 5.
- `region` — one of `world | europe | americas | middle-east | usa` (lowercase). `feedRegion` from the YAML source overrides the model's answer if present. Legacy stored `global` is read as `world`.

**Flash pacing — two modes** (controlled by `FLASH_GENERATION_MIN_INTERVAL_MS`):

| Mode | When | Behaviour |
|------|------|-----------|
| **UnconstrainedFlow** | env unset or empty | Each call runs immediately, once. No 429 retry. Use with billing or high RPM. |
| **ConstrainedFlow** | env set to a positive int (e.g. `15000`) | Enforces a minimum gap between call _starts_ (ms). On 429: exponential backoff up to 12 attempts, honouring the API's `retry in Ns` hint. `15000` ≈ 4 RPM, safely under the free-tier 5 RPM ceiling. |

> **Why this feels "infinite":** with ConstrainedFlow at 15 s and 20 clusters, summarize alone takes ≥ 20 × 15 s = **5 minutes** minimum, plus actual API latency on each call.

Output: `SummarizedCluster[]` — cluster + `headline`, `bullets`, `whyItMatters`, `tags`, `region`, `credits` (deduplicated source URLs from member items).

---

## Step 5 — Classify (`lib/pipeline/classify.ts`)

Assigns each cluster to one of the five homepage buckets — or marks it `Emerging`.

**Setup:** loads all rows from the `bucket_anchors` Supabase table. These are pre-embedded anchor phrases for each bucket (`world`, `business`, `tech`, `science`, `health`), seeded once via `scripts/seed-bucket-anchors.ts`. Throws if the table is empty.

**Per cluster:**
1. Compute cosine similarity between the cluster's **centroid** embedding and each bucket anchor embedding.
2. Compare the best similarity to **`CLASSIFY_SIMILARITY_THRESHOLD`** (env, `0`–`1`, default `0.65`).
   - **At or above threshold** → assign best-matching bucket. `categoryLine` is `null`.
   - **Below threshold** → bucket = `emerging`. One additional Flash call generates a short `categoryLine` label (max 8 words). This call also goes through the ConstrainedFlow/UnconstrainedFlow pacing, so each emerging cluster adds another pacing slot.

Output: `ClassifiedCluster[]` — every cluster now has `bucket` and `categoryLine`.

---

## Step 6 — Upsert (`lib/pipeline/upsert.ts`)

Writes the digest to Supabase atomically within today's UTC window.

1. **Delete** all existing `clusters` rows where `published_at` is in today's UTC window. This ensures a clean slate if the handler's idempotency check was bypassed or a partial run left stale rows.
2. **Upsert** all classified clusters. Each row contains:
   - `id` — UUID (assigned during clustering).
   - `embedding` — centroid vector.
   - `raw_items` — full array of source items (jsonb).
   - `summary` — `{ headline, bullets, why_it_matters, tags, region, credits }` (jsonb).
   - `bucket` — assigned bucket slug (including `emerging`).
   - `category_line` — Flash-generated label for emerging clusters, `null` for fixed buckets.
   - `published_at` — current timestamp.

Output: the same `ClassifiedCluster[]` passed in; throws on Supabase error.

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

## Homepage render (`routes/+page.server.ts`)

The SvelteKit `load` function runs on every homepage request (SSR). It:

1. Reads today's UTC window (same logic as the handler).
2. Queries `clusters` for rows in that window, ordered by `published_at` descending.
3. **Skips `emerging` rows** — normalized via `normalizeClusterBucket`. Emerging clusters are stored in the DB for ops/future use but never shown on the main digest UI.
4. Groups remaining rows into `Partial<Record<Bucket, DigestCard[]>>` — one array per bucket.
5. Returns `{ digest, fuseThreshold }` to the page. `DIGEST_FUSE_THRESHOLD` (default `0.4`) controls Fuse.js search sensitivity.

The five homepage sections (`DIGEST_DISPLAY_BUCKETS` in `lib/config/buckets.constants.ts`) are lowercase slugs: `world`, `business`, `tech`, `science`, `health`. The UI uppercases labels (e.g. **WORLD**). `BUCKET_ORDER` extends this with `emerging` for typing and pipeline use.

---

## Timing reference

Rough estimates for a typical day (~100 raw items, ~20 clusters, free-tier Gemini):

| Phase | Typical duration |
|-------|-----------------|
| Fetch | 5–15 s (parallel network) |
| Embed | 15–45 s (5 batches × parallel calls) |
| Cluster | < 1 s (in-memory) |
| Summarize (ConstrainedFlow 15 s) | 5–10 min |
| Summarize (UnconstrainedFlow) | 30–90 s |
| Classify | 5–30 s + pacing for Emerging |
| Upsert | 1–3 s |

The **total wall time** is dominated by summarize. If the `curl` call appears to hang, it is almost certainly waiting on Flash calls — not stuck.

---

## Useful env vars at a glance

| Variable | Default | Effect |
|----------|---------|--------|
| `CRON_SECRET` | — | Protects `/api/digest` |
| `LOG_LEVEL` | `info` | Pino log level (`debug` shows per-batch and per-cluster lines) |
| `LOG_PRETTY` | auto | `1`/`true` = pretty; `0`/`false` = JSON; unset = pretty in dev, JSON in prod |
| `FLASH_MODEL` | `gemini-2.5-flash` | Flash model for summarize + classify |
| `FLASH_GENERATION_MIN_INTERVAL_MS` | unset | Unset = UnconstrainedFlow; positive int (e.g. `15000`) = ConstrainedFlow |
| `FLASH_GENERATION_TEMPERATURE` | unset | Sampling temperature override |
| `FLASH_THINKING_BUDGET` | unset | Gemini 2.5 thinking token budget |
| `EMBEDDING_MODEL` | `gemini-embedding-2-preview` | Embedding model |
| `EMBEDDING_DIMENSION` | `768` | Must match `vector(N)` in SQL migration |
| `CLUSTER_SIMILARITY_THRESHOLD` | `0.85` | Item-to-centroid merge cutoff; lower → fewer clusters |
| `CLASSIFY_SIMILARITY_THRESHOLD` | `0.65` | Cosine cutoff: below → Emerging |
| `DIGEST_SUMMARIZE_MAX_CLUSTERS` | unset | Cap Flash calls for debugging |
| `DIGEST_FUSE_THRESHOLD` | `0.4` | Homepage search fuziness |
| `USE_MOCK_DATA` | `false` | Only exact `true` enables mock from `load`. When `false`, an empty live digest shows no cards (no client-side mock substitute). |
