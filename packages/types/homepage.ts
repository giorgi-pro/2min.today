import type { Credit } from "./digest.js";
import type { Topic } from "./topics.js";

export type DndTopicItem = { id: Topic; topic: Topic };

export type NewsItem = {
  title: string;
  bullets: string[];
  whyItMatters: string;
  credits: Credit[];
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
