import { NEWS_SOURCES } from '@2min.today/lib/config/news-sources';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({
  newsSourcesCount: NEWS_SOURCES.length,
});
