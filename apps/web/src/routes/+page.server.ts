import { getSupabaseClient } from '$lib/supabase/client';
import type { Bucket } from '$lib/config/buckets';

type SummaryJson = {
  headline: string;
  bullets: string[];
  why_it_matters: string;
  sources?: unknown;
};

export type DigestCard = {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  categoryLine: string | null;
  sources: unknown[];
};

export const load = async () => {
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
    return { digest: {} as Partial<Record<Bucket, DigestCard[]>> };
  }

  const digest = (data ?? []).reduce<Partial<Record<Bucket, DigestCard[]>>>((acc, row) => {
    const b = row.bucket as Bucket;
    const s = row.summary as SummaryJson;
    if (!acc[b]) acc[b] = [];
    acc[b]?.push({
      headline: s.headline,
      bullets: s.bullets,
      whyItMatters: s.why_it_matters,
      categoryLine: row.category_line,
      sources: Array.isArray(s.sources) ? s.sources : [],
    });
    return acc;
  }, {});

  return { digest };
};
