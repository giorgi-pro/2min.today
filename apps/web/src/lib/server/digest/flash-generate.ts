/**
 * Flash generateContent call wrapper with two strategies based on `FLASH_GENERATION_MIN_INTERVAL_MS`:
 *
 * UnconstrainedFlow (env unset or empty):
 *   `withFlashGenerationRetry` executes the call once with no delay and no 429 retry loop.
 *   Best when billing covers burst traffic or RPM limits are high.
 *
 * ConstrainedFlow (env set to a positive integer, e.g. 15000):
 *   Enforces a minimum gap between `generateContent` starts (one call every N ms).
 *   On 429, retries with exponential backoff (up to 12 attempts), honoring the API's
 *   "retry in Ns" hint when present.
 *   Use for free-tier pacing (~4 RPM at 15s, under the 5 RPM free-tier ceiling).
 */
import { getFlashGenerationMinIntervalMs } from './models';

let nextFlashGenerateAllowedAt = 0;

function parseRetryAfterMs(message: string): number | null {
  const m = message.match(/retry in ([\d.]+)\s*s/i);
  if (!m) return null;
  const sec = Number.parseFloat(m[1]);
  if (!Number.isFinite(sec) || sec < 0) return null;
  return Math.ceil(sec * 1000) + 500;
}

function isGenerateContentRateLimit(e: unknown): boolean {
  const err = e as { status?: number; message?: string };
  const msg = err?.message ?? String(e);
  return (
    err?.status === 429 ||
    /429|Too Many Requests|quota exceeded|rate.?limit/i.test(msg)
  );
}

export async function acquireFlashGenerationSlot(): Promise<void> {
  const intervalMs = getFlashGenerationMinIntervalMs();
  if (intervalMs == null) return;
  const now = Date.now();
  const wait = nextFlashGenerateAllowedAt - now;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  nextFlashGenerateAllowedAt = Date.now() + intervalMs;
}

const MAX_FLASH_RETRIES = 12;

export async function withFlashGenerationRetry<T>(run: () => Promise<T>): Promise<T> {
  const intervalMs = getFlashGenerationMinIntervalMs();
  if (intervalMs == null) {
    return run();
  }

  let backoffMs = 2000;
  for (let attempt = 0; attempt < MAX_FLASH_RETRIES; attempt++) {
    await acquireFlashGenerationSlot();
    try {
      return await run();
    } catch (e) {
      if (attempt === MAX_FLASH_RETRIES - 1) throw e;
      if (!isGenerateContentRateLimit(e)) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      const fromApi = parseRetryAfterMs(msg);
      const waitMs = Math.min(
        120_000,
        Math.max(fromApi ?? 0, backoffMs, intervalMs),
      );
      await new Promise((r) => setTimeout(r, waitMs));
      backoffMs = Math.min(backoffMs * 2, 90_000);
    }
  }
  throw new Error('Unreachable');
}
