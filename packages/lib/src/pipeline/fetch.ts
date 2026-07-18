import { logger } from "@2min.today/logging";
import type { RawItem } from "@2min.today/types";
import type { NewsSource } from "@config/app/news-sources";
import {
  getNewsSources,
  type NewsSourceRss,
  type NewsSourceType,
} from "@config/app/news-sources";
import { XMLParser } from "fast-xml-parser";

export interface FetchSourceResult {
  id: string;
  type: NewsSourceType;
  enabled: boolean;
  ok: boolean;
  itemCount: number;
  durationMs: number;
  error?: string;
}

export interface FetchWithDiagnostics {
  items: RawItem[];
  sources: FetchSourceResult[];
  dedupedCount: number;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  // Large reputable feeds (e.g. Guardian world) exceed fast-xml-parser's default
  // entity-expansion caps. Raise them for these trusted sources; per-entity size
  // and nesting-depth limits still guard against billion-laughs.
  processEntities: {
    maxTotalExpansions: 100000,
    maxEntityCount: 100000,
    maxExpandedLength: 5_000_000,
  },
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractContent(entry: Record<string, any>): string {
  const raw =
    entry["content:encoded"] ??
    entry.content?.["#text"] ??
    entry.content ??
    entry.description ??
    entry["media:description"] ??
    "";

  const text =
    typeof raw === "string"
      ? raw
      : typeof raw === "object"
        ? JSON.stringify(raw)
        : String(raw);
  return stripHtml(text).slice(0, 800);
}

function extractLink(entry: Record<string, any>): string {
  if (typeof entry.link === "string") return entry.link;
  if (entry.link?.["@_href"]) return entry.link["@_href"];
  if (Array.isArray(entry.link)) {
    const alt = entry.link.find((l: any) => l["@_rel"] === "alternate");
    return alt?.["@_href"] ?? entry.link[0]?.["@_href"] ?? "";
  }
  return entry.guid ?? "";
}

async function fetchOneRss(source: NewsSourceRss): Promise<RawItem[]> {
  const res = await fetch(source.url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);

  const entries: Record<string, any>[] =
    parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];

  const arr = Array.isArray(entries) ? entries : [entries];

  return arr.map(
    (entry): RawItem => ({
      id: extractLink(entry) || `${source.label}-${entry.title}`,
      title:
        typeof entry.title === "string"
          ? entry.title
          : (entry.title?.["#text"] ?? ""),
      content: extractContent(entry),
      source: source.label,
      url: extractLink(entry),
      published: entry.pubDate
        ? new Date(entry.pubDate)
        : entry.published
          ? new Date(entry.published)
          : new Date(),
      ...(source.region ? { feedRegion: source.region } : {}),
    }),
  );
}

async function runSource(
  source: NewsSource,
): Promise<{ items: RawItem[]; diag: FetchSourceResult }> {
  const t0 = Date.now();
  if (!source.enabled) {
    return {
      items: [],
      diag: {
        id: source.id,
        type: source.type,
        enabled: false,
        ok: true,
        itemCount: 0,
        durationMs: 0,
      },
    };
  }

  try {
    const items = await fetchOneRss(source);
    const durationMs = Date.now() - t0;
    return {
      items,
      diag: {
        id: source.id,
        type: source.type,
        enabled: true,
        ok: true,
        itemCount: items.length,
        durationMs,
      },
    };
  } catch (e) {
    const durationMs = Date.now() - t0;
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(
      { sourceId: source.id, errMessage: msg },
      "fetch source failed",
    );
    return {
      items: [],
      diag: {
        id: source.id,
        type: source.type,
        enabled: true,
        ok: false,
        itemCount: 0,
        durationMs,
        error: msg,
      },
    };
  }
}

export async function fetchRawItemsWithDiagnostics(): Promise<FetchWithDiagnostics> {
  const allSources = getNewsSources();
  const settled = await Promise.all(allSources.map((s) => runSource(s)));

  const items: RawItem[] = [];
  const sources: FetchSourceResult[] = [];
  for (const { items: chunk, diag } of settled) {
    items.push(...chunk);
    sources.push(diag);
  }

  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return { items: deduped, sources, dedupedCount: deduped.length };
}

export async function fetchRawItems(): Promise<RawItem[]> {
  const { items, sources, dedupedCount } = await fetchRawItemsWithDiagnostics();
  const rawItemSum = sources.reduce((a, s) => a + s.itemCount, 0);
  logger.info({ sources, rawItemSum, dedupedCount }, "fetch complete");
  return items;
}
