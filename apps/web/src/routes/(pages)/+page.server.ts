import { env } from '@config';
import { getSupabaseClient } from '@lib/supabase/client';
import { buildMockDigest } from '@lib/mock-digest';
import type { Bucket } from '@lib/config/buckets';
import { normalizeClusterBucket } from '@lib/config/buckets.constants';
import { parseRegion, type Credit } from '@lib/types/digest';
import type { DigestCard, SummaryJson } from '@lib/types/news';

export const load = async () => {
  const fuseThreshold = env.DIGEST_FUSE_THRESHOLD ?? 0.4;
  const useMock = env.USE_MOCK_DATA === 'true';

  if (useMock) {
    const mock = buildMockDigest();
    return {
      digest: mock.cards as Partial<Record<Bucket, DigestCard[]>>,
      summaries: mock.summaries,
      fuseThreshold,
      useMockData: true,
    };
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await getSupabaseClient()
    .from('clusters')
    .select('id, bucket, category_line, summary, published_at')
    .gte('published_at', todayStart.toISOString())
    .lt('published_at', todayEnd.toISOString())
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Supabase load error:', error);
    return {
      digest: {} as Partial<Record<Bucket, DigestCard[]>>,
      summaries: {} as Partial<Record<Bucket, string[]>>,
      fuseThreshold,
      useMockData: false,
    };
  }

  const digest = (data ?? []).reduce<Partial<Record<Bucket, DigestCard[]>>>((acc, row) => {
    const b = normalizeClusterBucket(row.bucket);
    const s = row.summary as SummaryJson;
    if (!acc[b]) acc[b] = [];
      acc[b]?.push({
        headline: s.headline,
        bullets: s.bullets,
        whyItMatters: s.why_it_matters,
        tags: Array.isArray(s.tags) ? (s.tags as string[]).filter((t) => typeof t === 'string') : [],
        region: parseRegion(s.region),
        categoryLine: row.category_line,
        credits: Array.isArray(s.credits)
          ? s.credits.filter((c): c is Credit => typeof c?.source === 'string' && typeof c?.url === 'string')
          : [],
        bucket: b,
        isBreaking: false,
        isLive: false,
      });
    return acc;
  }, {});

  return { digest, summaries: {} as Partial<Record<Bucket, string[]>>, fuseThreshold, useMockData: false };
};
