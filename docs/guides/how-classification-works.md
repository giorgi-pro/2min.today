# How Classification Works

Every news cluster is classified on **two independent axes** — they don't constrain each other, and a cluster gets a value on both:

- **Region** — *where* the story happened.
- **Topic** — *what* the story is about (the subject).

A cluster about a business deal in the Middle East is `region: middle-east` **and** `topic: business` at the same time — something a single merged "bucket" couldn't express.

The two axes are classified very differently: **region is LLM-only** (plus an optional feed-level override); **topic is anchor-embedding-first with an LLM fallback**.

---

## Region (7 values)

`usa`, `europe`, `middle-east`, `americas`, `asia`, `africa`, `world` (catch-all — multi-region or unclear geography).

Region is assigned entirely inside `summarize.ts`: Gemini receives the cluster's news items and returns a `region` value alongside the headline, bullets, and topic hint — no extra Gemini call, and **no embedding/anchor step for region at all**.

One override: if the RSS source a story came from has a `region:` hint set in `packages/config/app/news-sources.yaml` (e.g. BBC Africa, BBC Asia, BBC Middle East), that hint wins outright and the LLM's region answer is discarded (`feedRegion ?? parseRegion(llmRegion)` in `summarize.ts`). This exists because general wire feeds under-produce stories about Africa and Asia specifically, so a handful of region-pinned feeds guarantee coverage.

---

## Topic (8 values)

`politics`, `conflict`, `business`, `tech`, `science`, `health`, `environment`, `society` (catch-all — anything that doesn't fit the other seven).

These were chosen to be **news-worthy first**, not entertainment-oriented.

Topic classification is a two-stage process across two pipeline files:

### Stage 1 — LLM hint (inside `summarize.ts`)

During the same summarize call that produces the headline/bullets/region, Gemini is also asked for a `topic` guess. This is stored as `llmTopic` on the `SummarizedCluster` — a **hint**, not the final answer. If Gemini returns something unrecognized, `llmTopic` is `null`.

### Stage 2 — Anchor embedding match (inside `classify.ts`)

After summarization, each cluster's **centroid embedding** (the element-wise average of all its member item embeddings, at 768 dimensions) is compared via cosine similarity against 8 pre-seeded **anchor embeddings** stored in the `topic_anchors` Postgres table.

Each anchor is the embedding of a dense descriptive phrase for its topic (`packages/config/app/topics.yaml`) — for example:

- `conflict` → _"war conflict military defense armed forces security terrorism insurgency ceasefire invasion airstrikes troops weapons geopolitics sanctions intelligence espionage nuclear missiles combat casualties"_
- `environment` → _"environment climate change global warming emissions carbon energy renewable oil gas electricity wildfires floods droughts hurricanes natural disasters biodiversity pollution conservation sustainability weather"_
- `society` → _"society culture education religion human rights migration immigration crime justice courts law policing protests inequality demographics social issues civil rights community daily life human interest"_

The topic with the **highest cosine similarity** becomes the candidate (`bestTopic`, `bestSim`).

---

## The Decision Tree (topic only — region has no tree, see above)

```
cluster centroid embedding
        │
        ▼
Compare against 8 topic anchor embeddings (cosine similarity)
        │
        ▼
bestSim >= CLASSIFY_SIMILARITY_THRESHOLD (default 0.65)?
   ├── YES → use bestTopic                          (anchor match)
   └── NO  → llmTopic set (from summarize step)?
                  ├── YES → use llmTopic             (LLM fallback)
                  └── NO  → use bestTopic anyway      (closest anchor, low confidence)
```

The embedding path is preferred because anchor embeddings are stable and deterministic across days. The LLM fallback catches cases where the cluster's content sits in a semantic gap between anchors — a niche or cross-domain story that doesn't score well against any single anchor phrase but that Gemini can still name correctly from context.

---

## Why This Design

- **No separate Gemini call for topic classification.** `llmTopic` is produced during summarization for free, alongside region. If the embedding match is confident, the LLM's guess is simply ignored; if not, it's already there as a backup.
- **Region and topic are decoupled on purpose.** The previous single-bucket scheme forced "geography vs topic" priority rules (does a US business story go to `usa` or `business`?) that always felt arbitrary. Splitting the axes removes the conflict entirely — it's `usa` **and** `business`.
- **Region skips the anchor system entirely.** Region is a much smaller, more literal classification problem ("where did this happen") that Gemini handles reliably in one pass; there was no measured benefit to building a second anchor table for it, and feed-level `region:` hints already cover the systematic gaps (Africa, Asia) that a general-wire LLM guess tends to miss.
- **The catch-alls are safe nets, not dumping grounds.** `world` (region) and `society` (topic) exist so ambiguous or multi-region stories always land somewhere sensible rather than being discarded or force-fit into the wrong category.

---

## Seeding the Anchors

The topic anchor embeddings are generated once by running (from the repo root):

```bash
pnpm --filter @2min.today/web run seed:anchors
```

This must be re-run any time the anchor text in `packages/config/app/topics.yaml` changes. The script (`packages/scripts/seed-topic-anchors.ts`) uses the same `EMBEDDING_DIMENSION` (default 768) and `EMBEDDING_MODEL` as the pipeline, so vectors are always comparable.
