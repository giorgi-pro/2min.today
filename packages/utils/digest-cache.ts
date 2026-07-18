import type { DigestCard, Topic } from "@2min.today/types";

// Bump the key if the cached shape ever changes incompatibly.
const STORAGE_KEY = "2min.today/digest-cache/v1";

export type CachedDigestPayload = {
  digest: Partial<Record<Topic, DigestCard[]>>;
  summaries: Partial<Record<Topic, string[]>>;
};

type StoredDigestCache = CachedDigestPayload & {
  // UTC calendar date (YYYY-MM-DD) the digest was generated for. The digest
  // is a once-per-UTC-day artifact, so this is the correct freshness key —
  // no separate TTL is needed within the same day.
  date: string;
};

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cached payload for today (UTC), or null if absent/stale/corrupt. */
export function readDigestCache(): CachedDigestPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDigestCache>;
    if (
      parsed.date !== todayUtcDate() ||
      typeof parsed.digest !== "object" ||
      typeof parsed.summaries !== "object"
    ) {
      return null;
    }
    return { digest: parsed.digest ?? {}, summaries: parsed.summaries ?? {} };
  } catch {
    return null;
  }
}

export function writeDigestCache(payload: CachedDigestPayload): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredDigestCache = { ...payload, date: todayUtcDate() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage full/unavailable (private browsing, quota) — safe to skip caching.
  }
}
