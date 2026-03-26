# Project Pitch: 2min.today

### **The Goal**
Deliver a daily, informationally dense **global digest**: one coherent edition that compresses the day’s major stories into roughly a **two-minute read**, with high signal and low noise in a typography-first, **editorial brutalist** UI.

### **The Premise**
Most news AI products are either noisy or over-built. **2min.today** behaves like a digital broadsheet: one scheduled pipeline turns many reputable inputs into a single edition, instead of an endless feed.

---

### **Technical architecture**

Aligned with [ADR-001](./adr/0001-backend%20technology%20stack%20selection.md), [ADR-002](./adr/0002-daily-digest-pipeline-architecture-and-implementation.md), and [RFC-001](./rfc/0001-daily-digest-pipeline.md).

| Component | Implementation |
| :--- | :--- |
| **App shell** | **SvelteKit 5** (`apps/web`): server routes for APIs, SSR `load` for the homepage digest — one TypeScript codebase, no separate backend service. |
| **UI** | **Tailwind** + shared **`@2min.today/ui`** (`packages/ui`). Editorial palette and surfaces in `apps/web/tailwind.config.ts` (tomato / teal / slate, tonal layers); **Inter** as the primary face (variable opsz/weight via Google Fonts in `app.html`). |
| **Ingestion** | **RSS** (agencies wired in `lib/pipeline/fetch.ts`, e.g. Reuters, AP, TechCrunch) plus **X API v2** recent search for short-form signal — same fetch path the RFC describes. |
| **Deduping** | Per-item **Gemini embeddings** (`gemini-embedding-2-preview`), **cosine similarity**, and **Supabase `pgvector`** so multiple articles about one event collapse into a single cluster. |
| **Synthesis** | **Gemini 1.5 Flash** with **structured JSON** (`headline`, exactly **three** bullets, **`why_it_matters`**) — no ad-hoc prose parsing. |
| **Persistence** | **Supabase** `clusters` (+ `bucket_anchors` seeded from `apps/web/src/lib/config/buckets.yaml`). Service role for the pipeline; anon + RLS for public reads. |
| **Scheduling** | **Nightly digest:** cron hits `GET /api/digest` (Vercel Cron as in ADR-002; path and schedule in project config). **Breaking:** [RFC-005](./rfc/0005-breaking-news-pipeline.md) — GitHub Actions every **15 minutes** calls `GET /api/breaking`; heuristics first, then one Flash call per qualifying story; rows use `is_live` on the same `clusters` table. |

---

### **Categorization & edition shape**

Matches `buckets.yaml`, `BUCKET_ORDER` in code, and `classify.ts` (`SIMILARITY_THRESHOLD = 0.65`).

- **Fixed buckets:** `World`, `Business`, `Tech`, `Science`, `Health` — names and anchor phrases live only in **`apps/web/src/lib/config/buckets.yaml`** (loaded via `buckets.ts`); the UI and pipeline stay in sync.
- **Assignment:** Cluster centroid embedding vs precomputed bucket anchors; **≥ 0.65** cosine similarity → best bucket; **&lt; 0.65** → **`Emerging`** with a short **`category_line`** from Flash (see `classify.ts`).
- **`Emerging`** is not in the YAML anchor set; it is a runtime bucket only.
- **Daily edition:** The digest handler is **idempotent per UTC day** (`routes/api/digest/+server.ts`): if any row already exists in today’s `published_at` window, the pipeline does not run again. On a successful run, `upsert.ts` clears that same UTC-day window and bulk-writes the new cluster set; the homepage groups rows by `bucket` in `+page.server.ts`.

---

### **Why it stands out**

- **Single-repo full stack:** TypeScript end-to-end, no extra worker language, deployable with one pipeline (ADR-001).
- **Cost posture:** Designed around **Vercel**, **Supabase**, and **Gemini** free tiers for this workload (ADR-001).
- **Grounding & credit:** Clusters aggregate multiple URLs; structured summaries and **source credits** (see [RFC-006](./rfc/0006-source-credits.md)) support transparency without cluttering the card chrome.
- **Two clocks:** A **once-a-day** deep digest plus a **lightweight breaking** path (RFC-005) without doubling the nightly embedding bill.

---

### **Conclusion**

**2min.today** is a constrained product bet: **one daily edition**, **five fixed sections plus Emerging**, **vector dedupe**, and **JSON-shaped AI output**, documented so the implementation stays traceable to [ADR-001](./adr/0001-backend%20technology%20stack%20selection.md), [ADR-002](./adr/0002-daily-digest-pipeline-architecture-and-implementation.md), [RFC-001](./rfc/0001-daily-digest-pipeline.md), [RFC-005](./rfc/0005-breaking-news-pipeline.md), and [RFC-006](./rfc/0006-source-credits.md).
