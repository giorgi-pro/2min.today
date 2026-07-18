import { env } from '@config/env'
import { logger } from '@logging'
import { cronUnauthorizedResponse, fetchDigestSourcesDiagnostics } from '@services'
import { json } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const requestId = randomUUID()
  const log = logger.child({ route: 'api/digest/sources', requestId, method: 'GET' })

  log.debug(
    { path: url.pathname, hasSecretQuery: url.searchParams.has('secret') },
    'digest sources request received',
  )

  const unauthorized = cronUnauthorizedResponse(url, env.CRON_SECRET, 'digest/sources unauthorized')
  if (unauthorized) {
    log.debug('digest sources rejected: unauthorized')
    return unauthorized
  }

  log.info('digest sources authorized, fetching diagnostics')
  const t0 = Date.now()

  try {
    const payload = await fetchDigestSourcesDiagnostics()
    const durationMs = Date.now() - t0

    log.info(
      {
        durationMs,
        rawItemSum: payload.rawItemSum,
        dedupedItems: payload.dedupedItems,
        sourceCount: payload.sources.length,
      },
      'digest sources fetch completed',
    )
    return json({ status: 'ok', ...payload })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage, durationMs: Date.now() - t0 }, 'digest sources fetch failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
