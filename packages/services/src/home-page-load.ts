import { env } from '@2min.today/config/env'
import { type Db, getDb } from '@2min.today/data/db'
import { logger } from '@2min.today/logging'
import { type Credit, type DigestCard, parseRegion, parseTopic, type SummaryJson, TOPIC_ORDER, type Topic } from '@2min.today/types'
import { buildMockDigest } from '@utils'

export type HomePageLoadData = {
  digest: Partial<Record<Topic, DigestCard[]>>
  summaries: Partial<Record<Topic, string[]>>
  fuseThreshold: number
  useMockData: boolean
  // Identifies which digest run this data reflects. `null` in mock mode or
  // when the clusters table is empty. The route uses this as the HTTP ETag.
  etag: string | null
  // Same run as `etag`, as an ISO 8601 string for display (e.g. TimeTile).
  lastDigestRunAt: string | null
}

// A topic row backfills toward this many cards using older stories when
// today's news alone doesn't reach it.
const MIN_CARDS_PER_TOPIC = 5

// Cache is keyed by the latest `published_at` in `clusters`, not by time or
// UTC date. A cache hit means "no digest run has written since we last
// fetched" — checked via one cheap indexed query — so the expensive
// today's-clusters + backfill queries only run when the data actually
// changed. Not shared across serverless instances; a cold instance just
// re-runs the cheap check once.
type CacheEntry = {
  forRunAt: string | null
  digest: Partial<Record<Topic, DigestCard[]>>
}

let cache: CacheEntry | null = null

function toIso(runAt: string | null): string | null {
  return runAt ? new Date(runAt).toISOString() : null
}

async function getLastDigestRunAt(db: Db): Promise<string | null> {
  // Cast to text in SQL: `pg` auto-parses timestamptz into a JS Date, whose
  // default .toString() is locale/timezone-formatted and not a stable cache
  // key. The text cast returns a fixed, comparable string directly.
  const { rows } = await db.query<{ run_at: string | null }>(
    'select max(published_at)::text as run_at from clusters',
  )
  return rows[0]?.run_at ?? null
}

type ClusterRow = {
  id: string
  region: string | null
  topic: string | null
  summary: SummaryJson
  published_at: string
}

function toDigestCard(row: ClusterRow): DigestCard {
  const s = row.summary
  return {
    headline: s.headline,
    bullets: s.bullets,
    whyItMatters: s.why_it_matters,
    tags: Array.isArray(s.tags) ? (s.tags as string[]).filter(t => typeof t === 'string') : [],
    region: parseRegion(row.region ?? s.region),
    credits: Array.isArray(s.credits)
      ? s.credits.filter((c): c is Credit => typeof c?.source === 'string' && typeof c?.url === 'string')
      : [],
    topic: parseTopic(row.topic),
  }
}

/** Runs the actual Postgres queries. Returns null on DB error (caller does not cache a failure). */
async function fetchDigestFromDb(): Promise<Partial<Record<Topic, DigestCard[]>> | null> {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const digest: Partial<Record<Topic, DigestCard[]>> = {}

  try {
    const db = getDb()

    // topic is not null: defensive guard against any malformed row, which
    // would otherwise default via parseTopic() and contaminate a topic's fill.
    const today = await db.query<ClusterRow>(
      `select id, region, topic, summary, published_at
       from clusters
       where published_at >= $1 and published_at < $2 and topic is not null
       order by published_at desc`,
      [todayStart.toISOString(), todayEnd.toISOString()],
    )

    for (const row of today.rows) {
      const topic = parseTopic(row.topic)
      ;(digest[topic] ??= []).push(toDigestCard(row))
    }

    // All topics, not just ones with a card today — a topic with zero cards
    // today (or an unrun digest) still needs to backfill from history.
    const topicsBelowMin = TOPIC_ORDER.filter(
      t => (digest[t]?.length ?? 0) < MIN_CARDS_PER_TOPIC,
    )

    if (topicsBelowMin.length > 0) {
      // Up to MIN_CARDS_PER_TOPIC older rows per topic; trimmed to the exact
      // shortfall per topic below.
      const backfill = await db.query<ClusterRow>(
        `select id, region, topic, summary, published_at
         from (
           select id, region, topic, summary, published_at,
             row_number() over (partition by topic order by published_at desc) as rn
           from clusters
           where published_at < $1 and topic = any($2::text[])
         ) ranked
         where rn <= $3
         order by topic, published_at desc`,
        [todayStart.toISOString(), topicsBelowMin, MIN_CARDS_PER_TOPIC],
      )

      const shortfallByTopic = new Map<Topic, number>(
        topicsBelowMin.map(t => [t, MIN_CARDS_PER_TOPIC - (digest[t]?.length ?? 0)]),
      )

      for (const row of backfill.rows) {
        const topic = parseTopic(row.topic)
        const remaining = shortfallByTopic.get(topic) ?? 0
        if (remaining <= 0) continue
        ;(digest[topic] ??= []).push(toDigestCard(row))
        shortfallByTopic.set(topic, remaining - 1)
      }
    }
  } catch (err) {
    logger.error({ err, route: 'home-page-load' }, 'Postgres load error')
    return null
  }

  return digest
}

export async function loadHomePageDigest(): Promise<HomePageLoadData> {
  const fuseThreshold = env.DIGEST_FUSE_THRESHOLD ?? 0.25
  const useMock = env.USE_MOCK_DATA === 'true'

  if (useMock) {
    const mock = buildMockDigest()
    return {
      digest: mock.cards as Partial<Record<Topic, DigestCard[]>>,
      summaries: mock.summaries,
      fuseThreshold,
      useMockData: true,
      etag: null,
      lastDigestRunAt: null,
    }
  }

  let runAt: string | null
  try {
    runAt = await getLastDigestRunAt(getDb())
  } catch (err) {
    logger.error({ err, route: 'home-page-load' }, 'Postgres load error (runAt check)')
    return serveStaleOrEmpty(fuseThreshold)
  }

  if (cache && cache.forRunAt === runAt) {
    logger.debug({ runAt }, 'home page digest cache hit')
    return { digest: cache.digest, summaries: {}, fuseThreshold, useMockData: false, etag: runAt, lastDigestRunAt: toIso(runAt) }
  }

  const digest = await fetchDigestFromDb()

  if (digest === null) {
    // DB error: serve the previous cached value if we have one rather than
    // an empty page; never cache the failure itself.
    return serveStaleOrEmpty(fuseThreshold)
  }

  cache = { forRunAt: runAt, digest }

  const topicCounts = Object.fromEntries(
    Object.entries(digest).map(([t, cards]) => [t, cards?.length ?? 0]),
  )
  logger.info({ runAt, topicCounts }, 'home page digest cache refreshed')

  return {
    digest,
    summaries: {} as Partial<Record<Topic, string[]>>,
    fuseThreshold,
    useMockData: false,
    etag: runAt,
    lastDigestRunAt: toIso(runAt),
  }
}

function serveStaleOrEmpty(fuseThreshold: number): HomePageLoadData {
  if (cache) {
    logger.warn({ forRunAt: cache.forRunAt }, 'home page digest DB error, serving stale cache')
    return {
      digest: cache.digest,
      summaries: {},
      fuseThreshold,
      useMockData: false,
      etag: cache.forRunAt,
      lastDigestRunAt: toIso(cache.forRunAt),
    }
  }
  return {
    digest: {} as Partial<Record<Topic, DigestCard[]>>,
    summaries: {} as Partial<Record<Topic, string[]>>,
    fuseThreshold,
    useMockData: false,
    etag: null,
    lastDigestRunAt: null,
  }
}
