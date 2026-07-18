import { logger } from '@2min.today/logging'
import type { Db } from '@2min.today/data/db'
import { pipeline } from '@lib/pipeline'
import { randomUUID } from 'node:crypto'

export type DigestCronResult =
  | { kind: 'already-run' }
  | { kind: 'success'; clustersCreated: number }

export async function runDigestCron(db: Db): Promise<DigestCronResult> {
  const log = logger.child({ runId: randomUUID(), route: 'digest-handler', pipeline: 'digest' })
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const { rows: existing } = await db.query(
    'select id from clusters where published_at >= $1 and published_at < $2 limit 1',
    [todayStart.toISOString(), todayEnd.toISOString()],
  )

  if (existing.length) {
    log.info('digest skipped: already run today')
    return { kind: 'already-run' }
  }

  const handlerT0 = Date.now()
  const result = await pipeline.run(db, { log })
  log.info(
    {
      clustersCreated: result.length,
      handlerDurationMs: Date.now() - handlerT0,
    },
    'digest handler success',
  )
  return { kind: 'success', clustersCreated: result.length }
}
