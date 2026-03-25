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
  isBreaking: boolean;
};

export type MockDigest = {
  cards: Partial<Record<Bucket, MockDigestCard[]>>;
  summaries: Partial<Record<Bucket, string[]>>;
};

export function buildMockDigest(): MockDigest {
  const cards: Partial<Record<Bucket, MockDigestCard[]>> = {};
  const summaries: Partial<Record<Bucket, string[]>> = {};
  for (const cat of mockData) {
    const b = cat.name as Bucket;
    summaries[b] = cat.summary;
    if (!cards[b]) cards[b] = [];
    const list = cards[b] as MockDigestCard[];
    for (const n of cat.news) {
      list.push({
        headline: n.title,
        bullets: bulletsFromMockContent(n.content),
        whyItMatters: n.whyItMatters,
        tags: deduceMockTags(n.title, n.source, b),
        categoryLine: n.source,
        sources: [],
        bucket: b,
        isBreaking: n.isBreaking,
      });
    }
  }
  return { cards, summaries };
}
