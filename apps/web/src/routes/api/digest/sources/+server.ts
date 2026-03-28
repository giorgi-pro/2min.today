import { randomUUID } from 'node:crypto'
import { digestLogger } from '@2min.today/logging'
import { env } from '@config/env'
import { fetchRawItemsWithDiagnostics } from '@lib/pipeline/fetch'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  if (url.searchParams.get('secret') !== env.CRON_SECRET) {
    digestLogger.debug('digest/sources unauthorized')
    return new Response('Unauthorized', { status: 401 })
  }

  const runId = randomUUID()
  const log = digestLogger.child({ runId, route: 'digest-sources' })

  try {
    const { sources, dedupedCount } = await fetchRawItemsWithDiagnostics()
    const rawItemSum = sources.reduce((a, s) => a + s.itemCount, 0)
    log.info({ rawItemSum, dedupedItems: dedupedCount }, 'digest/sources fetch done')
    return json({
      status: 'ok',
      sources,
      rawItemSum,
      dedupedItems: dedupedCount,
    })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage }, 'digest/sources fetch failed')
    return json(
      {
        status: 'error',
        message: errMessage,
      },
      { status: 500 },
    )
  }
}
