import { logger } from '@logging'
import { loadHomePageDigest } from '@services'
import { json } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from './$types'

// Public read endpoint: same data the homepage SSR renders, fetched by the
// client for cache-first loading. No secret — this isn't a cron trigger,
// just a read of already-public content.
//
// ETag = which digest run this data reflects (see home-page-load.ts). The
// browser sends it back as If-None-Match on the next request; if it still
// matches, we skip re-sending the body entirely (304). `must-revalidate`
// means the browser always asks, but asking is cheap: one indexed query on
// the backend when nothing changed.
export const GET: RequestHandler = async ({ request }) => {
  const requestId = randomUUID()
  const log = logger.child({ route: 'api/digest/data', requestId, method: 'GET' })

  const t0 = Date.now()
  try {
    const { etag: rawEtag, ...body } = await loadHomePageDigest()
    // HTTP ETags must be quoted strings (RFC 7232).
    const etag = rawEtag ? `"${rawEtag}"` : null
    const ifNoneMatch = request.headers.get('if-none-match')
    const headers = {
      'cache-control': 'public, max-age=0, must-revalidate',
      ...(etag ? { etag } : {}),
    }

    if (etag && ifNoneMatch === etag) {
      log.info({ durationMs: Date.now() - t0, etag }, 'digest data not modified')
      return new Response(null, { status: 304, headers })
    }

    log.info({ durationMs: Date.now() - t0, etag }, 'digest data request completed')
    return json(body, { headers })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage, durationMs: Date.now() - t0 }, 'digest data request failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
