import type { Bucket } from "./buckets";
import type { Credit } from "./digest";

export type DndBucketItem = { id: Bucket; bucket: Bucket };

export type Category = {
  name: string;
  summary: string[];
  news: {
    title: string;
    bullets: string[];
    whyItMatters: string;
    credits: Credit[];
    isBreaking: boolean;
    isLive: boolean;
    tags: string[];
  }[];
};
