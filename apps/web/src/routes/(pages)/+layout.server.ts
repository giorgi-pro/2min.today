import { NEWS_SOURCES } from '@config/app/news-sources'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = () => ({
  newsSourcesCount: NEWS_SOURCES.length,
})
