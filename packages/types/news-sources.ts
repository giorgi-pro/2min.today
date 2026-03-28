import type { Region } from "./digest";

export type NewsSourceType = "rss" | "x";

export interface NewsSourceRss {
  id: string;
  type: "rss";
  enabled: boolean;
  url: string;
  label: string;
  region?: Region;
}

export interface NewsSourceX {
  id: string;
  type: "x";
  enabled: boolean;
  query: string;
  max_results: number;
  since_days: number;
}

export type NewsSource = NewsSourceRss | NewsSourceX;
