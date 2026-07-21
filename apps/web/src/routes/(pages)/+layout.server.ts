import { NEWS_SOURCES } from '@config/app/news-sources'
import { env } from '@config/env'
import { logger } from '@logging'
import { randomUUID } from 'node:crypto'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = () => {
  const requestId = randomUUID()
  const log = logger.child({ route: '(pages)+layout', requestId })

  const newsSourcesCount = NEWS_SOURCES.length

  log.info({ newsSourcesCount }, 'layout server load')

  return {
    newsSourcesCount,
    // PUBLIC_-prefixed: safe to send to the browser (pusher-js needs these to connect).
    pusherKey: env.PUBLIC_PUSHER_APP_KEY ?? null,
    pusherCluster: env.PUBLIC_PUSHER_CLUSTER ?? null,
  }
}
