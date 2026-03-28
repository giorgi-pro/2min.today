import { env } from '@config/env'
import { getSupabaseServiceRoleClient } from '@data/supabase/server'
import { logger } from '@logging'
import { cronUnauthorizedResponse, runDigestCron } from '@services'
import { json } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const requestId = randomUUID()
  const log = logger.child({ route: 'api/digest', requestId, method: 'GET' })

  log.debug(
    { path: url.pathname, hasSecretQuery: url.searchParams.has('secret') },
    'digest cron request received',
  )

  const unauthorized = cronUnauthorizedResponse(url, env.CRON_SECRET, 'digest unauthorized')
  if (unauthorized) {
    log.debug('digest cron rejected: unauthorized')
    return unauthorized
  }

  log.info('digest cron authorized, starting pipeline')

  const supabase = getSupabaseServiceRoleClient()
  const handlerT0 = Date.now()

  try {
    const result = await runDigestCron(supabase)
    const durationMs = Date.now() - handlerT0

    if (result.kind === 'already-run') {
      log.info({ outcome: 'already-run-today', durationMs }, 'digest cron finished')
      return json({ status: 'already-run-today' })
    }

    log.info(
      { outcome: 'success', clustersCreated: result.clustersCreated, durationMs },
      'digest cron finished',
    )
    return json({ status: 'success', clustersCreated: result.clustersCreated })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error(
      { err: errMessage, handlerDurationMs: Date.now() - handlerT0 },
      'digest pipeline failed',
    )
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
