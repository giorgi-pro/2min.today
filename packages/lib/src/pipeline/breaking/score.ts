import type { RawItem } from '@2min.today/lib/types/digest';
import type { BreakingCandidate } from '@2min.today/lib/types/breaking';

const BREAKING_THRESHOLD = 3;
const MAX_AGE_MINUTES = 20;

const SCORE_MAP: Array<{ pattern: RegExp; points: number }> = [
  { pattern: /^(breaking|urgent|flash|alert)[:\s]/i,               points: 5 },
  { pattern: /\b(breaking news|just in)\b/i,                       points: 3 },
  { pattern: /\b(killed|dead|deaths|explosion|attack|crash)\b/i,   points: 2 },
  { pattern: /\b(earthquake|tsunami|hurricane|tornado)\b/i,        points: 2 },
  { pattern: /\b(resign(ed)?|fired|arrested|indicted|charged)\b/i, points: 2 },
  { pattern: /\b(war|invasion|sanctions|ceasefire)\b/i,            points: 2 },
  { pattern: /\b(emergency|evacuation|shutdown)\b/i,               points: 1 },
];

const TRUSTED_SOURCES = new Set(['Reuters', 'AP News', 'Associated Press', 'AP']);

export function scoreItems(items: RawItem[]): BreakingCandidate[] {
  const now = Date.now();
  const cutoff = new Date(now - MAX_AGE_MINUTES * 60 * 1000);

  return items
    .filter((item) => item.published >= cutoff)
    .map((item) => {
      let score = 0;
      for (const { pattern, points } of SCORE_MAP) {
        if (pattern.test(item.title)) score += points;
      }
      if (now - item.published.getTime() < 5 * 60 * 1000) score += 1;
      if (TRUSTED_SOURCES.has(item.source)) score += 1;
      return { url: item.url, title: item.title, source: item.source, published: item.published, score };
    })
    .filter((c) => c.score >= BREAKING_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}
