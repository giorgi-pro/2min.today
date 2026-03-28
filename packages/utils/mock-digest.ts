import type { Bucket, MockDigest, MockDigestCard } from "@2min.today/types";
import { mockData } from "./mock-data";
import { bulletsFromMockContent, deduceMockTags } from "./mock-tags";

export type { MockDigest, MockDigestCard } from "@2min.today/types";

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
        region: n.region,
        categoryLine: n.source,
        credits: n.credits,
        bucket: b,
        isBreaking: n.isBreaking,
        isLive: n.isLive ?? false,
      });
    }
  }
  return { cards, summaries };
}
