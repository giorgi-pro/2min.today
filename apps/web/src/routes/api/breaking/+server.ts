import { env } from '@config/env'
import { getSupabaseServiceRoleClient } from '@data/supabase/server'
import { logger } from '@logging'
import { cronUnauthorizedResponse, runBreakingCron } from '@services'
import { json } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const requestId = randomUUID()
  const log = logger.child({ route: 'api/breaking', requestId, method: 'GET' })

  log.debug(
    { path: url.pathname, hasSecretQuery: url.searchParams.has('secret') },
    'breaking cron request received',
  )

  const unauthorized = cronUnauthorizedResponse(url, env.BREAKING_SECRET, 'breaking unauthorized')
  if (unauthorized) {
    log.debug('breaking cron rejected: unauthorized')
    return unauthorized
  }

  log.info('breaking cron authorized, starting pipeline')

  const t0 = Date.now()

  try {
    const supabase = getSupabaseServiceRoleClient()
    const published = await runBreakingCron(supabase)
    const durationMs = Date.now() - t0

    log.info({ published, durationMs }, 'breaking cron finished')
    return json({ status: 'ok', published })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage, durationMs: Date.now() - t0 }, 'breaking pipeline failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
