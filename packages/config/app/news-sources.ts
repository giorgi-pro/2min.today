/// <reference path="../vite-env.d.ts" />
import {
  type NewsSource,
  type Region,
  VALID_REGIONS,
} from "@2min.today/types";
import { parse } from "yaml";
import newsSourcesYaml from "./news-sources.yaml?raw";

export type {
  NewsSource,
  NewsSourceRss,
  NewsSourceType,
} from "@2min.today/types";

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
    assert(o.type === "rss", `sources[${i}].type must be rss`);
    assert(
      typeof o.enabled === "boolean",
      `sources[${i}].enabled must be boolean`,
    );
    assert(
      typeof o.url === "string" && o.url.length > 0,
      `sources[${i}].url required`,
    );
    assert(
      typeof o.label === "string" && o.label.length > 0,
      `sources[${i}].label required`,
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
  }
  return out;
}

const parsed = parse(newsSourcesYaml) as unknown;
export const NEWS_SOURCES: NewsSource[] = parseSources(parsed);

export function getNewsSources(): NewsSource[] {
  return NEWS_SOURCES;
}
