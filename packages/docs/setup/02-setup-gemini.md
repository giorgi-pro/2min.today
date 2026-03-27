# 02-setup-gemini.md

**Gemini API key for embeddings and summarization (ADR-001)**

## 1. Get a key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Create API key**
3. Copy the key (typically starts with `AIza`)

## 2. Add to `apps/web/.env`

```env
GEMINI_API_KEY="AIzaSy..."
```

## 3. Models (env vars)

Set in `apps/web/.env` (see `.env.example`). Code reads them in `lib/server/digest/models.ts` (`getFlashModel`, `getEmbeddingModel`, `getEmbeddingDimension`, `getClusterSimilarityThreshold`, `getClassifySimilarityThreshold`).

| Variable | Default (if unset) | Role |
|----------|--------------------|------|
| `FLASH_MODEL` | `gemini-2.5-flash` | Summarize, Emerging label, breaking cards |
| `EMBEDDING_MODEL` | `gemini-embedding-2-preview` | Digest + bucket-anchor embeddings |
| `EMBEDDING_DIMENSION` | `768` | Gemini `outputDimensionality`; must match `vector(N)` in SQL |
| `FLASH_GENERATION_MIN_INTERVAL_MS` | *(empty)* | See below |
| `CLUSTER_SIMILARITY_THRESHOLD` | `0.85` | Item vs cluster-centroid cosine when merging stories; lower → fewer clusters |
| `CLASSIFY_SIMILARITY_THRESHOLD` | `0.65` | Centroid vs bucket-anchor cosine; below → `Emerging` |

## 4. Flash pacing (ConstrainedFlow / UnconstrainedFlow)

Two strategies for Flash `generateContent` calls, controlled by **`FLASH_GENERATION_MIN_INTERVAL_MS`** (see `lib/server/digest/flash-generate.ts`):

- **ConstrainedFlow** — set to a **positive integer** (e.g. `15000` = one call every 15s, ~4 RPM). Spaces Flash calls and retries on 429 with exponential backoff. Use on **free tier** or any quota-limited plan.
- **UnconstrainedFlow** — **unset or empty**. No inter-call delay, no 429 retry loop — each Flash call runs once. Use with **billing** or high RPM limits.

## 5. Quotas

The **free tier** limits **`generateContent`** per model — e.g. **`gemini-2.5-flash`** is often on the order of **~5 requests per minute** per project. The digest issues **one Flash call per cluster** plus **`Emerging`** calls, so either enable **ConstrainedFlow** (e.g. `FLASH_GENERATION_MIN_INTERVAL_MS=15000`), or use a **paid** plan; see [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). **Embeddings** use a separate quota.
