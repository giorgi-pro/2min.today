import type {
  ParsedQuery,
  RawToken,
  Token,
  Transform,
} from "@2min.today/types";

export type {
  ParsedQuery,
  Token,
  TokenClass,
} from "@2min.today/types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "with",
  "from",
  "by",
  "about",
  "as",
  "into",
  "through",
]);

const THRESHOLD_QUOTED = 0.1;
const THRESHOLD_NUMERIC = 0.1;
const THRESHOLD_ACRONYM = 0.15;

function sanitize(tokens: RawToken[]): RawToken[] {
  return tokens
    .map((t) => ({
      ...t,
      text: t.quoted
        ? t.text
        : t.text
            .replace(/[^a-zA-Z0-9\s\-]/g, "")
            .replace(/\s+/g, " ")
            .trim(),
    }))
    .filter((t) => t.text.length > 0);
}

function dropStopWords(tokens: RawToken[]): RawToken[] {
  return tokens.filter(
    (t) => t.quoted || !STOP_WORDS.has(t.text.toLowerCase()),
  );
}

function dropTooShort(tokens: RawToken[]): RawToken[] {
  return tokens.filter((t) => t.quoted || t.text.length >= 2);
}

function dropShortNonAcronyms(tokens: RawToken[]): RawToken[] {
  return tokens.filter((t) => {
    if (t.quoted) return true;
    if (t.text.length !== 2) return true;
    return /^[A-Z]{2}$/.test(t.text);
  });
}

const sanitizePipeline: Transform[] = [
  sanitize,
  dropStopWords,
  dropTooShort,
  dropShortNonAcronyms,
];

function extractQuotedPhrases(raw: string): {
  quoted: RawToken[];
  remainder: string;
} {
  const quoted: RawToken[] = [];
  const remainder = raw.replace(/"([^"]+)"/g, (_, phrase: string) => {
    const text = phrase.trim();
    if (text) quoted.push({ text, quoted: true });
    return " ";
  });
  return { quoted, remainder };
}

function splitRemainder(remainder: string): RawToken[] {
  return remainder
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => ({ text: t, quoted: false }));
}

function classifyToken(raw: RawToken): Token {
  if (raw.quoted)
    return {
      text: raw.text,
      class: "quoted-phrase",
      threshold: THRESHOLD_QUOTED,
    };
  if (/\d/.test(raw.text))
    return { text: raw.text, class: "numeric", threshold: THRESHOLD_NUMERIC };
  if (/^[A-Z]{2,4}$/.test(raw.text))
    return { text: raw.text, class: "acronym", threshold: THRESHOLD_ACRONYM };
  return { text: raw.text, class: "word", threshold: -1 };
}

function resolveThreshold(tokens: Token[], globalThreshold: number): number {
  if (tokens.some((t) => t.class === "quoted-phrase" || t.class === "numeric"))
    return THRESHOLD_NUMERIC;
  if (tokens.some((t) => t.class === "acronym")) return THRESHOLD_ACRONYM;
  return globalThreshold;
}

export function parseQuery(
  raw: string,
  globalThreshold: number,
): ParsedQuery | null {
  const { quoted, remainder } = extractQuotedPhrases(raw);
  const split = splitRemainder(remainder);

  const allRaw = [...quoted, ...split];
  const filtered = sanitizePipeline.reduce((acc, fn) => fn(acc), allRaw);

  if (filtered.length === 0) return null;

  const classified = filtered.map(classifyToken);
  const threshold = resolveThreshold(classified, globalThreshold);
  const tokens = classified.map((t) =>
    t.threshold === -1 ? { ...t, threshold } : t,
  );

  return {
    tokens,
    searchString: tokens.map((t) => t.text).join(" "),
    threshold,
  };
}
