import type { Bucket } from '$lib/config/buckets';
import { mockData } from '$lib/mock-data';
import { bulletsFromMockContent, deduceMockTags } from '$lib/mock-tags';

export type MockDigestCard = {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  categoryLine: string | null;
  sources: unknown[];
  bucket: Bucket;
};

export function buildMockDigest(): Partial<Record<Bucket, MockDigestCard[]>> {
  const acc: Partial<Record<Bucket, MockDigestCard[]>> = {};
  for (const cat of mockData) {
    const b = cat.name as Bucket;
    if (!acc[b]) acc[b] = [];
    const list = acc[b] as MockDigestCard[];
    for (const n of cat.news) {
      list.push({
        headline: n.title,
        bullets: bulletsFromMockContent(n.content),
        whyItMatters: n.whyItMatters,
        tags: deduceMockTags(n.title, n.source, b),
        categoryLine: n.source,
        sources: [],
        bucket: b,
      });
    }
  }
  return acc;
}
