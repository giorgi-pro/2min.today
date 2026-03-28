import type { Bucket } from "./buckets";

export type Region = "world" | "europe" | "americas" | "middle-east" | "usa";

export interface Credit {
  source: string;
  url: string;
}

export const VALID_REGIONS = new Set<Region>([
  "world",
  "europe",
  "americas",
  "middle-east",
  "usa",
]);

export function parseRegion(value: unknown): Region {
  if (typeof value === "string") {
    const normalized =
      value === "global" || value === "Global" ? "world" : value;
    if (VALID_REGIONS.has(normalized as Region)) return normalized as Region;
  }
  return "world";
}

export interface RawItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  published: Date;
  feedRegion?: Region;
}

export interface EmbeddedItem extends RawItem {
  embedding: number[];
}

export interface Cluster {
  id: string;
  items: EmbeddedItem[];
  centroidEmbedding: number[];
}

export interface SummarizedCluster extends Cluster {
  headline: string;
  bullets: string[];
  whyItMatters: string;
  tags: string[];
  region: Region;
  credits: Credit[];
  llmBucket: Bucket | null;
}

export interface ClassifiedCluster extends SummarizedCluster {
  bucket: Bucket;
  categoryLine: string | null;
}
