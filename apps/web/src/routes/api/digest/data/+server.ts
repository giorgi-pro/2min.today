import { logger } from '@logging'
import { loadHomePageDigest } from '@services'
import { json } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from './$types'

// Public read endpoint: same data the homepage SSR renders, fetched by the
// client for cache-first / stale-while-revalidate loading. No secret — this
// isn't a cron trigger, just a read of already-public content.
export const GET: RequestHandler = async () => {
  const requestId = randomUUID()
  const log = logger.child({ route: 'api/digest/data', requestId, method: 'GET' })

  const t0 = Date.now()
  try {
    const data = await loadHomePageDigest()
    log.info({ durationMs: Date.now() - t0 }, 'digest data request completed')

    // Matches the backend in-memory cache TTL (home-page-load.ts): CDN/browser
    // may serve this for 2 minutes, and up to 10 more while revalidating.
    return json(data, {
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
      },
    })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage, durationMs: Date.now() - t0 }, 'digest data request failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
