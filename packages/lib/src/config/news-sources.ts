import newsSourcesYaml from "./news-sources.yaml?raw";
import { parse } from "yaml";
import type { Region } from "@lib/types/digest";
import { VALID_REGIONS } from "@lib/types/digest";

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

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`news-sources.yaml: ${msg}`);
}

function parseSources(raw: unknown): NewsSource[] {
  assert(
    raw && typeof raw === "object" && "sources" in raw,
    "root must have `sources` array",
  );
  const list = (raw as { sources: unknown }).sources;
  assert(Array.isArray(list), "`sources` must be an array");

  const out: NewsSource[] = [];
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    assert(row && typeof row === "object", `sources[${i}] must be an object`);
    const o = row as Record<string, unknown>;
    assert(
      typeof o.id === "string" && o.id.length > 0,
      `sources[${i}].id required`,
    );
    assert(
      o.type === "rss" || o.type === "x",
      `sources[${i}].type must be rss or x`,
    );
    assert(
      typeof o.enabled === "boolean",
      `sources[${i}].enabled must be boolean`,
    );

    if (o.type === "rss") {
      assert(
        typeof o.url === "string" && o.url.length > 0,
        `sources[${i}].url required for rss`,
      );
      assert(
        typeof o.label === "string" && o.label.length > 0,
        `sources[${i}].label required for rss`,
      );
      if (o.region !== undefined && o.region !== null) {
        assert(
          typeof o.region === "string" && VALID_REGIONS.has(o.region as Region),
          `sources[${i}].region must be one of: ${[...VALID_REGIONS].join(", ")}`,
        );
      }
      out.push({
        id: o.id,
        type: "rss",
        enabled: o.enabled,
        url: o.url,
        label: o.label,
        ...(o.region ? { region: o.region as Region } : {}),
      });
    } else {
      assert(
        typeof o.query === "string" && o.query.length > 0,
        `sources[${i}].query required for x`,
      );
      const maxResults = o.max_results;
      const sinceDays = o.since_days;
      assert(
        maxResults === undefined ||
          (typeof maxResults === "number" &&
            maxResults > 0 &&
            maxResults <= 100),
        `sources[${i}].max_results must be 1–100 if set`,
      );
      assert(
        sinceDays === undefined ||
          (typeof sinceDays === "number" && sinceDays > 0 && sinceDays <= 7),
        `sources[${i}].since_days must be 1–7 if set`,
      );
      out.push({
        id: o.id,
        type: "x",
        enabled: o.enabled,
        query: o.query,
        max_results: typeof maxResults === "number" ? maxResults : 20,
        since_days: typeof sinceDays === "number" ? sinceDays : 1,
      });
    }
  }
  return out;
}

const parsed = parse(newsSourcesYaml) as unknown;
export const NEWS_SOURCES: NewsSource[] = parseSources(parsed);

export function getNewsSources(): NewsSource[] {
  return NEWS_SOURCES;
}
