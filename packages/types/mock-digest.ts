import type { Credit, Region } from "./digest.js";
import type { Topic } from "./topics.js";

export type MockDigestCard = {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  region: Region;
  credits: Credit[];
  topic: Topic;
};

export type MockDigest = {
  cards: Partial<Record<Topic, MockDigestCard[]>>;
  summaries: Partial<Record<Topic, string[]>>;
};
