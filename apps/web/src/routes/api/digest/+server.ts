import { randomUUID } from 'node:crypto'
import { digestLogger } from '@2min.today/logging'
import { env } from '@config/env'
import { pipeline } from '@lib/pipeline'
import { getSupabaseServiceRoleClient } from '@lib/supabase/server'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  if (url.searchParams.get('secret') !== env.CRON_SECRET) {
    digestLogger.debug('digest unauthorized')
    return new Response('Unauthorized', { status: 401 })
  }

  const runId = randomUUID()
  const log = digestLogger.child({
    runId,
    route: 'digest-handler',
    pipeline: 'digest',
  })

  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const supabase = getSupabaseServiceRoleClient()

  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .gte('published_at', todayStart.toISOString())
    .lt('published_at', todayEnd.toISOString())
    .limit(1)

  if (existing?.length) {
    log.info('digest skipped: already run today')
    return json({ status: 'already-run-today' })
  }

  const handlerT0 = Date.now()
  try {
    const result = await pipeline.run(supabase, { log })
    log.info(
      {
        clustersCreated: result.length,
        handlerDurationMs: Date.now() - handlerT0,
      },
      'digest handler success',
    )
    return json({ status: 'success', clustersCreated: result.length })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage, handlerDurationMs: Date.now() - handlerT0 }, 'digest pipeline failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
