import { XMLParser } from 'fast-xml-parser';
import { TwitterApi } from 'twitter-api-v2';
import { env } from '$env/dynamic/private';
import type { RawItem, Region } from '$lib/types/digest';

const RSS_FEEDS: { url: string; source: string; region?: Region }[] = [
  { url: 'https://feeds.reuters.com/reuters/topNews', source: 'Reuters' },
  { url: 'https://feeds.reuters.com/reuters/worldNews', source: 'Reuters' },
  { url: 'https://feeds.reuters.com/reuters/USNews', source: 'Reuters', region: 'usa' },
  { url: 'https://feeds.reuters.com/reuters/europeanNews', source: 'Reuters', region: 'europe' },
  { url: 'https://rss.app/feeds/v1.1/tAjLcDBcVDkSVOUI.xml', source: 'AP' },
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg' },
  { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', source: 'WSJ' },
];

const X_SEARCH_QUERY =
  '(news OR breaking OR update OR analysis) lang:en -filter:replies -filter:quote min_faves:50';

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractContent(entry: Record<string, any>): string {
  const raw =
    entry['content:encoded'] ??
    entry.content?.['#text'] ??
    entry.content ??
    entry.description ??
    entry['media:description'] ??
    '';

  const text = typeof raw === 'string' ? raw : typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
  return stripHtml(text).slice(0, 800);
}

function extractLink(entry: Record<string, any>): string {
  if (typeof entry.link === 'string') return entry.link;
  if (entry.link?.['@_href']) return entry.link['@_href'];
  if (Array.isArray(entry.link)) {
    const alt = entry.link.find((l: any) => l['@_rel'] === 'alternate');
    return alt?.['@_href'] ?? entry.link[0]?.['@_href'] ?? '';
  }
  return entry.guid ?? '';
}

async function fetchRss(): Promise<RawItem[]> {
  const items: RawItem[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source, region }) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return [];
      const xml = await res.text();
      const parsed = parser.parse(xml);

      const entries: Record<string, any>[] =
        parsed?.rss?.channel?.item ??
        parsed?.feed?.entry ??
        [];

      const arr = Array.isArray(entries) ? entries : [entries];

      return arr.map((entry): RawItem => ({
        id: extractLink(entry) || `${source}-${entry.title}`,
        title: typeof entry.title === 'string' ? entry.title : entry.title?.['#text'] ?? '',
        content: extractContent(entry),
        source,
        url: extractLink(entry),
        published: entry.pubDate ? new Date(entry.pubDate) : entry.published ? new Date(entry.published) : new Date(),
        ...(region ? { feedRegion: region } : {}),
      }));
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      items.push(...result.value);
    }
  }

  return items;
}

async function fetchTweets(): Promise<RawItem[]> {
  const bearerToken = env.X_BEARER_TOKEN;
  if (!bearerToken) return [];

  try {
    const client = new TwitterApi(bearerToken).readOnly;

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const sinceDate = yesterday.toISOString().split('T')[0];

    const result = await client.v2.search(X_SEARCH_QUERY, {
      max_results: 20,
      sort_order: 'relevancy',
      'tweet.fields': ['created_at', 'author_id', 'text'],
      start_time: `${sinceDate}T00:00:00Z`,
    });

    return (result.data?.data ?? []).map((tweet): RawItem => ({
      id: tweet.id,
      title: tweet.text.slice(0, 120),
      content: stripHtml(tweet.text).slice(0, 800),
      source: 'X',
      url: `https://x.com/i/status/${tweet.id}`,
      published: tweet.created_at ? new Date(tweet.created_at) : new Date(),
    }));
  } catch (e) {
    console.error('X API fetch failed:', e);
    return [];
  }
}

export async function fetchRawItems(): Promise<RawItem[]> {
  const [rssItems, tweets] = await Promise.all([fetchRss(), fetchTweets()]);
  const all = [...rssItems, ...tweets];

  const seen = new Set<string>();
  return all.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
