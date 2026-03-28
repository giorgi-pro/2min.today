# How Classification Works

Every news cluster goes through two classification stages before it reaches the homepage. The result is a single `bucket` value — one of 10 fixed labels that determines which section of the digest the story appears in.

## The 10 Buckets

There are two kinds of buckets:

| Kind           | Buckets                                             |
| -------------- | --------------------------------------------------- |
| **Geographic** | `usa`, `europe`, `middle-east`, `americas`, `world` |
| **Topical**    | `business`, `tech`, `science`, `health`, `sports`   |

The rule is **geography-first, topic-override**: a story lands in a topic bucket if it is clearly and primarily about that topic. Otherwise it routes by where it happened. `world` is the geographic catch-all for anything that doesn't fit a more specific region.

---

## Stage 1 — LLM Bucket (inside `summarize.ts`)

During summarization, Gemini receives the cluster's news items and is asked to produce a `bucket` value alongside the headline, bullets, and tags. This happens in the same API call that generates the full summary, so there is **no extra Gemini call** just for classification.

The prompt instructs Gemini to follow a two-step decision:

**STEP 1 — Topic override check (wins regardless of geography)**

| Bucket     | What qualifies                                                                            |
| ---------- | ----------------------------------------------------------------------------------------- |
| `business` | financial markets, economy, corporate earnings, monetary policy, trade, tariffs, currency |
| `tech`     | technology, AI, software, hardware, cybersecurity, startups                               |
| `science`  | scientific research, space, climate science                                               |
| `health`   | medicine, public health, wellness, lifestyle, mental health, parenting                    |
| `sports`   | sports, athletics, competitions, leagues, tournaments                                     |

**STEP 2 — Geographic routing (only if no topic override applies)**

| Bucket        | What qualifies                                                      |
| ------------- | ------------------------------------------------------------------- |
| `usa`         | US-domestic politics, government, law, society, culture, crime      |
| `europe`      | EU/UK/European politics, government, society, culture               |
| `middle-east` | MENA region politics, conflicts, society                            |
| `americas`    | Latin America, Canada, Caribbean politics, society                  |
| `world`       | Multi-region, unclear geography, or anything that doesn't fit above |

The result is stored as `llmBucket` on the `SummarizedCluster`. If Gemini returns an unrecognized value it is set to `null`.

---

## Stage 2 — Embedding Similarity (inside `classify.ts`)

After summarization, each cluster's **centroid embedding** (the element-wise average of all its member item embeddings, at 768 dimensions) is compared via cosine similarity against 10 pre-seeded **anchor embeddings** stored in the `bucket_anchors` Supabase table.

Each anchor is the embedding of a short descriptive phrase for its bucket — for example:

- `usa` → _"United States America US federal government Congress White House president domestic American politics policy Trump Biden legislation court ruling"_
- `health` → _"health medicine public health biomedical research wellness lifestyle habits nutrition mental health parenting child development fitness diet sleep screen time digital wellbeing"_
- `sports` → _"sports football soccer basketball tennis cricket rugby olympics athletics competitions leagues tournaments championships racing cycling swimming"_

The bucket with the **highest cosine similarity** is selected as the candidate. If that score is at or above the threshold (default **0.65**, tunable via `CLASSIFY_SIMILARITY_THRESHOLD` in `.env`), it wins outright.

---

## The Decision Tree

```
cluster centroid embedding
        │
        ▼
Compare against 10 anchor embeddings (cosine similarity)
        │
        ▼
bestSim >= 0.65?
   ├── YES → use best-matching anchor bucket         (embedding match)
   └── NO  → use llmBucket from summarize step
                  │
                  ▼
             llmBucket valid?
                  ├── YES → use llmBucket            (LLM fallback)
                  └── NO  → use 'world'              (hard fallback)
```

The embedding path is preferred because anchor embeddings are stable and deterministic. The LLM fallback handles edge cases where the cluster's content sits in a semantic gap between anchors (e.g. a highly niche or cross-domain story).

---

## Why This Design

- **No separate Gemini call for classification.** The `llmBucket` is produced during summarization for free. If the embedding is confident, the LLM result is ignored; if not, it's already there as a backup.
- **Geography-first in the prompt, embedding handles the rest.** The geographic anchor texts are rich with proper nouns (countries, institutions, leaders), which naturally pull geopolitically-scoped stories to the right bucket even when the topic is ambiguous.
- **Topic buckets win over geography in the prompt.** A story about the US stock market goes to `business`, not `usa`. A story about French pharmaceutical regulations goes to `health`, not `europe`. This keeps topic sections clean regardless of where the story originates.
- **`world` is the safe catch-all.** Any story that doesn't fit cleanly — multi-region, abstract, or ambiguous — lands in `world` rather than being discarded or mislabelled.

---

## Seeding the Anchors

The anchor embeddings are generated once by running:

```bash
npx tsx scripts/seed-bucket-anchors.ts
```

This must be re-run any time the anchor text in `buckets.yaml` changes. The script uses the same `EMBEDDING_DIMENSION` (default 768) and `EMBEDDING_MODEL` as the pipeline, so vectors are always comparable.
