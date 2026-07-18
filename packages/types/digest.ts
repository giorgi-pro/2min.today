import type { Topic } from "./topics.js";

export type Region =
  | "usa"
  | "europe"
  | "middle-east"
  | "americas"
  | "asia"
  | "africa"
  | "world";

export interface Credit {
  source: string;
  url: string;
}

// `world` is the catch-all / "all regions" and is never a filter toggle.
export const REGION_ORDER: Region[] = [
  "usa",
  "europe",
  "middle-east",
  "americas",
  "asia",
  "africa",
  "world",
];

export const VALID_REGIONS = new Set<Region>(REGION_ORDER);

export function parseRegion(value: unknown): Region {
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    const normalized = lower === "global" ? "world" : lower;
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
  llmTopic: Topic | null;
}

export interface ClassifiedCluster extends SummarizedCluster {
  topic: Topic;
}
