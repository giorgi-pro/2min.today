import type { Bucket } from '$lib/config/buckets';

export type Region = 'global' | 'europe' | 'americas' | 'middle-east' | 'usa';

export const VALID_REGIONS = new Set<Region>(['global', 'europe', 'americas', 'middle-east', 'usa']);

export function parseRegion(value: unknown): Region {
  if (typeof value === 'string' && VALID_REGIONS.has(value as Region)) return value as Region;
  return 'global';
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
}

export interface ClassifiedCluster extends SummarizedCluster {
  bucket: Bucket;
  categoryLine: string | null;
}
