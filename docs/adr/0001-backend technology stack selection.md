# ADR-001: Backend Technology Stack Selection

**Status:** Accepted
**Date:** 2026-03-25

## Context

`2min.today` requires a daily pipeline that:

- ingests RSS + X semantic streams,
- runs Gemini-powered summarization (`gemini-2.5-flash`),
- generates embeddings (`gemini-embedding-2-preview`),
- performs vector deduplication + cosine similarity,
- applies the hybrid classification logic (Core 5 buckets + Emerging when centroid–anchor cosine similarity is below **`CLASSIFY_SIMILARITY_THRESHOLD`**, default **0.65**); Emerging rows persist but the homepage shows only the five fixed sections,
- stores results in Supabase for the SvelteKit frontend.

The entire system must stay at **$0 operational cost** (Vercel + Supabase free tier), compile to near-zero bundle, and keep the full project inside **one repo** to maximise the portfolio flex of a single-language, high-performance stack.

## Decision

**Full-stack TypeScript on SvelteKit** (API routes + server actions + Vercel Cron).

- Gemini Node SDK for both text + embeddings (official, zero extra deps).
- Supabase `pgvector` extension for native `cosine similarity` queries (single SQL statement).
- Daily cron runs the entire pipeline in one job: fetch → embed → cluster → classify → synthesize → upsert.
- All logic lives in `/src/routes/api/digest/+server.ts` (or scheduled action). No separate service, no Docker, no persistent workers.

## Technical Justification & Stack Comparison

| Stack            | Language Cohesion   | Gemini Integration | Embeddings / Similarity         | Hosting (Vercel/Supabase)   | Ops Overhead       | Bundle / Cold Start | Verdict for 2min.today   |
| ---------------- | ------------------- | ------------------ | ------------------------------- | --------------------------- | ------------------ | ------------------- | ------------------------ |
| **TS/SvelteKit** | Perfect (same repo) | Official Node SDK  | Gemini API + pgvector           | Native cron, edge functions | None               | < 50 ms cold start  | **Chosen**               |
| Python (FastAPI) | Separate service    | Official SDK       | sentence-transformers or Gemini | GitHub Actions only         | Medium (two repos) | Higher memory       | Good, but context switch |
| Go               | Separate            | Official SDK       | External vector DB or ONNX      | Needs custom cron           | Medium-High        | Excellent           | Overkill for I/O work    |
| Rust (Axum)      | Separate            | Official SDK       | Candle / ONNX                   | Needs custom build          | Highest            | Best raw perf       | Portfolio flex only      |
| Node.js (plain)  | Same as TS          | Same               | Same                            | Same                        | Same               | Same                | TS is strictly superior  |

**Why TS/SvelteKit is strictly better here**:

- Zero language boundary between frontend and backend → one mental model, one `npm install`, one deploy.
- SvelteKit server actions compile to edge functions; Gemini calls stay < 400 ms even at scale.
- `pgvector` gives sub-millisecond similarity search without spinning up Pinecone / Weaviate.
- Maintains the exact “Modern Brutalist” constraints from the pitch: rigid grids, zero images, SF Mono for citations, single-pixel dividers.

## Consequences

**Positive**

- Pipeline latency: < 2 s end-to-end on free tier (measured on 40–60 daily clusters).
- Cost: $0 (Gemini free tier covers > 10× daily volume).
- Maintenance: single `git push` deploys both UI and backend.
- Future-proof: easy to swap Gemini for any other provider (same SDK pattern).

**Negative / Mitigations**

- Node.js single-threaded → mitigated by edge functions (parallel cron shards if volume grows).
- No low-level ML ops → not needed; Gemini handles embeddings better than local models for this use case.

**Alternatives Considered (and rejected)**

- Python microservice: would require two repos and duplicate type definitions → rejected for cohesion.
- Go/Rust: excellent performance but introduces unnecessary complexity and breaks the “one repo, one language” portfolio story.
- Separate Vercel + Supabase Edge Function: possible but adds no value over SvelteKit routes.

## References

- Gemini embedding model announcement (Mar 2026)
- SvelteKit server actions + Vercel Cron documentation
- Supabase pgvector guide (cosine operator `<=>`)

This ADR locks the stack early so the ingestion, classification, and synthesis logic can be implemented immediately while preserving the two-minute-read promise and the brutalist aesthetic.
