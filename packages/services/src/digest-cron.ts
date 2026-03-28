import { logger } from '@2min.today/logging'
import { pipeline } from '@lib/pipeline'
import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

export type DigestCronResult =
  | { kind: 'already-run' }
  | { kind: 'success'; clustersCreated: number }

export async function runDigestCron(supabase: SupabaseClient): Promise<DigestCronResult> {
  const log = logger.child({ runId: randomUUID(), route: 'digest-handler', pipeline: 'digest' })
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .gte('published_at', todayStart.toISOString())
    .lt('published_at', todayEnd.toISOString())
    .limit(1)

  if (existing?.length) {
    log.info('digest skipped: already run today')
    return { kind: 'already-run' }
  }

  const handlerT0 = Date.now()
  const result = await pipeline.run(supabase, { log })
  log.info(
    {
      clustersCreated: result.length,
      handlerDurationMs: Date.now() - handlerT0,
    },
    'digest handler success',
  )
  return { kind: 'success', clustersCreated: result.length }
}
