# Project Pitch: 2min.today

### **The Goal**

Deliver a daily, informationally dense **global digest**: one coherent edition that compresses the day's major stories into roughly a **two-minute read**, with high signal and low noise in a typography-first, **editorial brutalist** UI.

### **The Premise**

Most news AI products are either noisy or over-built. **2min.today** behaves like a digital broadsheet: one scheduled pipeline turns many reputable RSS feeds into a single edition, instead of an endless feed.

---

### **Technical architecture**

| Component        | Implementation                                                                                                                                                                                            |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App shell**     | **SvelteKit 5** (`apps/web`): server routes for APIs, one TypeScript codebase, no separate backend service.                                                                                              |
| **UI**            | **Tailwind** + shared **`@ui`** (`packages/ui`). Editorial palette and surfaces in `apps/web/tailwind.config.ts` (tomato / teal / slate, tonal layers); **Inter** as the primary face.                   |
| **Ingestion**     | **RSS only**, configured in `packages/config/app/news-sources.yaml` (per-source `enabled` flag, optional `region` hint); `lib/pipeline/fetch.ts` merges and dedupes.                                     |
| **Deduping**      | Per-item **Gemini embeddings** (`gemini-embedding-2-preview`), **cosine similarity**, and **Postgres `pgvector`** so multiple articles about one event collapse into a single cluster.                   |
| **Synthesis**     | **Gemini Flash** (`gemini-flash-latest`) with **structured JSON** (`headline`, exactly **three** bullets, **`why_it_matters`**, **`region`**, **`topic`**) — no ad-hoc prose parsing.                     |
| **Persistence**   | Plain **Postgres + pgvector** (via `pg`, no ORM) — `clusters` (+ `topic_anchors` seeded from `packages/config/app/topics.yaml`). Local dev runs it in Docker (`infra/`).                                  |
| **Scheduling**    | **Nightly digest:** cron hits `GET /api/digest` (idempotent per UTC day).                                                                                                                                 |
| **Caching**       | Backend: in-memory TTL cache (2 min) around the Postgres read, with stale-cache fallback on a DB error. Client: the homepage fetches digest data client-side and caches it in `localStorage` keyed by UTC day, painting instantly on repeat visits while revalidating in the background.  |

---

### **Two independent classification axes**

Every story cluster is classified on two axes that don't constrain each other:

- **Region** — *where* it happened. 7 values: `usa`, `europe`, `middle-east`, `americas`, `asia`, `africa`, `world` (catch-all). Assigned by the LLM during summarization; a source feed can force a region via a `region:` hint in `news-sources.yaml` (used for feeds like BBC Africa/Asia/Middle East that would otherwise be underrepresented).
- **Topic** — *what* it's about. 8 values, chosen for news-worthiness over entertainment: `politics`, `conflict`, `business`, `tech`, `science`, `health`, `environment`, `society`. Assigned primarily by cosine similarity against pre-seeded anchor embeddings (`topic_anchors` table), falling back to the LLM's own topic guess when the anchor match is weak.

The homepage renders one row per **topic**; **region** is a header filter that narrows cards across all rows. A story about a Middle East business deal, for example, is `topic: business` + `region: middle-east` simultaneously — something the old single-bucket model couldn't express.

Each topic row backfills toward a minimum of 5 cards using the most recent older stories when today's news alone doesn't reach it, so a quiet day for a given topic still shows a full row.

---

### **Daily edition mechanics**

- **Idempotent per UTC day** (`routes/api/digest/+server.ts`): if any row already exists in today's `published_at` window, the pipeline does not run again.
- On a successful run, the upsert step clears that same UTC-day window and bulk-writes the new cluster set inside one transaction.
- The homepage fetches the current digest client-side (`GET /api/digest/data`), grouping rows by **topic**.

---

### **Why it stands out**

- **Single-repo full stack:** TypeScript end-to-end, no extra worker language, deployable with one pipeline.
- **Cost posture:** Designed around Vercel and Gemini free tiers; local Postgres in Docker costs nothing to run.
- **Grounding & credit:** Clusters aggregate multiple source URLs; structured summaries and source credits support transparency without cluttering the card chrome.
- **Instant repeat visits:** the CSR-first homepage + `localStorage` cache means a returning reader sees the digest with no network wait, not just a fast server response.

---

### **Conclusion**

**2min.today** is a constrained product bet: **one daily edition**, **two independent classification axes** (7 regions × 8 news-worthy topics) instead of one merged bucket list, **vector dedupe**, and **JSON-shaped AI output** — kept simple enough that a solo developer can run the whole stack (SvelteKit, Postgres, Gemini) locally in Docker with no external SaaS dependency beyond the LLM itself.
