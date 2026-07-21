# How Caching Works

3 caches. Each keyed to the last digest run, not to time.

## 1. Browser localStorage

File: `packages/utils/digest-cache.ts`

- Key: `2min.today/digest-cache/v1`.
- Stores: `{ digest, summaries, date }`.
- Valid if `date` equals today's UTC date. Else treated as empty.
- Written after every successful fetch of `/api/digest/data`.
- On page load: if valid, render it right away. Then always fetch `/api/digest/data` in the background and update.

## 2. HTTP conditional cache (ETag)

File: `apps/web/src/routes/api/digest/data/+server.ts`

- Response header: `etag: "<latest published_at>"`.
- Response header: `cache-control: public, max-age=0, must-revalidate`.
- Browser sends the etag back as `If-None-Match` on the next request.
- If it matches: server returns `304 Not Modified`, no body sent.
- If it doesn't match: server returns `200` with the fresh body and a new etag.
- This is handled by the browser automatically. No client code needed.

No other route sets this header.

## 3. Server memory cache

File: `packages/services/src/home-page-load.ts`

- 1 variable in memory, per running server process. Not shared across instances.
- Key: latest `published_at` in `clusters` (`select max(published_at)::text`).
- On each request: run that 1 query.
- If it matches the cached key: return cached digest, no further query.
- If it doesn't match: query Postgres for today's clusters (`fetchDigestFromDb`, 2 queries), store result under the new key, return it.
- If a query fails: return the last cached value instead of an error. If there's no cached value at all, return empty data.
- Skipped when `USE_MOCK_DATA=true`.
- Same key is sent to the client as the ETag (#2).

## Digest pipeline runs once per UTC day

`digest-cron.ts` checks Postgres for a row already published today. If one exists, it skips the run.

## Not caches (don't confuse these)

- `FLASH_GENERATION_MIN_INTERVAL_MS` — rate limit on Gemini calls, not a cache.
- Dedup `Set` in `fetch.ts` — removes duplicate URLs within one fetch run only.
- No embedding cache — every item gets re-embedded every run.
- No search index cache — Fuse.js index rebuilt on every search.
- `db.ts`, `logger.ts`, `config/env` — built once per process, reused. Not data caches.
- Region filter (`digest-filter.ts`) and category order (`category-order.ts`) in localStorage — these store user preferences, not fetched data.
- Turborepo (`turbo.json`) — caches build output, unrelated to the app's data.
