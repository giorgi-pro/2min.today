import { NEWS_SOURCES } from '@config/app/news-sources'
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
  }
}
