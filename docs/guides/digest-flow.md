Here’s what happens when you run:

curl "http://localhost:3000/api/digest?secret=${CRON_SECRET}"
1. HTTP request hits SvelteKit
curl opens a single HTTP GET to /api/digest?secret=... and waits until the handler finishes. There is no streaming and no progress in the terminal—only the final JSON (or a hang until timeout).

2. Handler in +server.ts (+server.ts)
Uses **Pino** (`digestLogger` / per-run child with **`runId`**); set **`LOG_LEVEL`** / **`LOG_PRETTY`** in env to see structured logs in the terminal.
Compares secret to CRON_SECRET → 401 if wrong.
Computes today’s UTC window (todayStart … todayEnd).
Queries Supabase: any row in clusters with published_at in that window?
If yes → immediate {"status":"already-run-today"} (pipeline not run).
If no, calls await pipeline.run(supabase) and does not respond until that completes.
So “stuck” with no output usually means: step 5 is still running (or the process is blocked on network I/O).

3. Pipeline steps (index.ts)
All of this runs in order, on that same request:

Step	What it does	Why it can take a long time
fetchRawItems	RSS + X → list of raw items	Network; many feeds/items
embedItems	Gemini embeddings per item (batched)	Many API calls; separate quota from Flash
clusterItems	In-memory greedy clustering by cosine similarity (no DB in this step)	CPU
summarizeClusters	One Flash generateContent per cluster	With ConstrainedFlow (15000 ms), there is a minimum ~15 s between each Flash call → N clusters ≈ N × 15 s (plus real API latency)
classifyClusters	Cosine vs bucket anchors; extra Flash only for Emerging	Each Emerging story also waits for the same pacing slot
upsertClusters	Delete today’s window + bulk upsert	Usually quick
4. Why it feels “infinite”
curl shows nothing until the handler returns success/error/already-run.
With ConstrainedFlow and e.g. 20 clusters, summarize alone is on the order of 20 × 15 s ≈ 5 minutes minimum, before Emerging Flash calls and everything else.
Embeddings can also add minutes if there are hundreds of items.
So it’s usually not an infinite loop—it’s one long-running request.

5. What you should see when it finishes
{"status":"success","clustersCreated":N} — pipeline completed.
{"status":"error",...} — thrown error (e.g. API/DB).
{"status":"already-run-today"} — digest already ran for today’s UTC day.

6. Homepage vs DB
**`Emerging`** clusters can be written like any other bucket, but **`+page.server.ts`** only builds the digest map for the five YAML sections, so the main UI does not list **`Emerging`** as a category.
