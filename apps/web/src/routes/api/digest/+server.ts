import { digestLogger } from '@2min.today/logging'
import { cronUnauthorizedResponse, runDigestCron } from '@2min.today/services'
import { env } from '@config/env'
import { getSupabaseServiceRoleClient } from '@data/supabase/server'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const unauthorized = cronUnauthorizedResponse(url, env.CRON_SECRET, 'digest unauthorized')
  if (unauthorized) return unauthorized

  const supabase = getSupabaseServiceRoleClient()
  const handlerT0 = Date.now()

  try {
    const result = await runDigestCron(supabase)
    if (result.kind === 'already-run') {
      return json({ status: 'already-run-today' })
    }
    return json({ status: 'success', clustersCreated: result.clustersCreated })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    digestLogger.error(
      { err: errMessage, handlerDurationMs: Date.now() - handlerT0, route: 'digest-handler' },
      'digest pipeline failed',
    )
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
