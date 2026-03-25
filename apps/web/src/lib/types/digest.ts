import type { Bucket } from '$lib/config/buckets';

export interface RawItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  published: Date;
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
}

export interface ClassifiedCluster extends SummarizedCluster {
  bucket: Bucket;
  categoryLine: string | null;
}
