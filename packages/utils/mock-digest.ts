import {
  type MockDigest,
  type MockDigestCard,
  parseTopic,
  type Topic,
} from "@2min.today/types";
import { mockData } from "./mock-data";
import { bulletsFromMockContent, deduceMockTags } from "./mock-tags";

export type { MockDigest, MockDigestCard } from "@2min.today/types";

export function buildMockDigest(): MockDigest {
  const cards: Partial<Record<Topic, MockDigestCard[]>> = {};
  const summaries: Partial<Record<Topic, string[]>> = {};
  for (const cat of mockData) {
    // Mock categories predate the region/topic split; map their name to a topic.
    const topic = parseTopic(cat.name);
    if (!cards[topic]) cards[topic] = [];
    if (!summaries[topic]) summaries[topic] = [];
    (summaries[topic] as string[]).push(...cat.summary);
    const list = cards[topic] as MockDigestCard[];
    for (const n of cat.news) {
      list.push({
        headline: n.title,
        bullets: bulletsFromMockContent(n.content),
        whyItMatters: n.whyItMatters,
        tags: deduceMockTags(n.title, n.source, topic),
        region: n.region,
        credits: n.credits,
        topic,
      });
    }
  }
  return { cards, summaries };
}
