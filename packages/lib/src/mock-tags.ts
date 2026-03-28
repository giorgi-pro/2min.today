const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "as",
  "by",
  "with",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "no",
  "not",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "this",
  "that",
  "these",
  "those",
  "what",
  "which",
  "who",
  "whom",
  "whose",
  "if",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
  "about",
  "out",
  "up",
  "down",
  "off",
  "over",
  "it",
  "its",
  "they",
  "them",
  "their",
  "he",
  "she",
  "his",
  "her",
]);

export function deduceMockTags(
  headline: string,
  source: string,
  bucket: string,
): string[] {
  const normalized = headline
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP.has(w));

  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const w of normalized) {
    if (!seen.has(w)) {
      seen.add(w);
      uniq.push(w);
    }
  }

  const sorted = [...uniq].sort((a, b) => b.length - a.length);
  const picked = sorted.slice(0, 3);
  if (picked.length >= 1) {
    return picked.slice(0, Math.min(3, Math.max(1, picked.length)));
  }

  const src = source
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
  if (src) return [src];
  const b = bucket.toLowerCase().replace(/\s+/g, "-");
  return b ? [b] : ["news"];
}

export function bulletsFromMockContent(content: string): string[] {
  return content
    .split(". ")
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}
