import type { Bucket } from "./buckets";
import type { Credit, Region } from "./digest";

export type MockDigestCard = {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  region: Region;
  categoryLine: string | null;
  credits: Credit[];
  bucket: Bucket;
  isBreaking: boolean;
  isLive: boolean;
};

export type MockDigest = {
  cards: Partial<Record<Bucket, MockDigestCard[]>>;
  summaries: Partial<Record<Bucket, string[]>>;
};
