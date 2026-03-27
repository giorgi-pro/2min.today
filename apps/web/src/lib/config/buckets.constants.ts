export type Bucket = 'world' | 'business' | 'tech' | 'science' | 'health' | 'sports';

export const DIGEST_DISPLAY_BUCKETS: Bucket[] = ['world', 'business', 'tech', 'science', 'health', 'sports'];

export const BUCKET_ORDER: Bucket[] = [...DIGEST_DISPLAY_BUCKETS];

const BUCKET_ORDER_SET = new Set<string>(BUCKET_ORDER);

const LEGACY_CLUSTER_BUCKET: Record<string, Bucket> = {
  World: 'world',
  Business: 'business',
  Tech: 'tech',
  Science: 'science',
  Health: 'health',
  Sports: 'sports',
  Emerging: 'world',
};

export function normalizeClusterBucket(raw: string | null | undefined): Bucket {
  const s = raw?.trim() ?? '';
  const lower = s.toLowerCase();
  if (BUCKET_ORDER_SET.has(lower)) return lower as Bucket;
  const legacy = LEGACY_CLUSTER_BUCKET[s];
  if (legacy) return legacy;
  if (lower === 'global' || lower === 'emerging') return 'world';
  return 'world';
}
