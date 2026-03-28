import type { Bucket } from "./buckets";
import type { Credit } from "./digest";

export type DndBucketItem = { id: Bucket; bucket: Bucket };

export type NewsItem = {
  title: string;
  bullets: string[];
  whyItMatters: string;
  credits: Credit[];
  isBreaking: boolean;
  isLive: boolean;
  tags: string[];
};

export type Category = {
  name: string;
  summary: string[];
  news: NewsItem[];
};

export interface CategoryEntry {
  bucket: string;
  index: number;
  summary: string[];
  news: NewsItem[];
}
