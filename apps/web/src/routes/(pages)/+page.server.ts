import { logger } from '@logging'
import { loadHomePageDigest } from '@services'
import { randomUUID } from 'node:crypto'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const requestId = randomUUID()
  const log = logger.child({ route: '(pages)+page', requestId })

  log.debug('home page load started')

  const t0 = Date.now()

  try {
    const data = await loadHomePageDigest()
    const durationMs = Date.now() - t0

    const bucketCount = Object.keys(data.digest).length
    const cardCount = Object.values(data.digest).reduce((n, cards) => n + (cards?.length ?? 0), 0)

    log.info(
      {
        durationMs,
        useMockData: data.useMockData,
        fuseThreshold: data.fuseThreshold,
        bucketCount,
        cardCount,
      },
      'home page load completed',
    )

    return data
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    log.error({ err: errMessage, durationMs: Date.now() - t0 }, 'home page load failed')
    throw e
  }
}
