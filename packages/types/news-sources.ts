import type { Region } from "./digest.js";

export type NewsSourceType = "rss";

export interface NewsSourceRss {
  id: string;
  type: "rss";
  enabled: boolean;
  url: string;
  label: string;
  region?: Region;
}

export type NewsSource = NewsSourceRss;
