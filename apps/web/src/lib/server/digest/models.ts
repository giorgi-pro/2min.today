import { env } from '$env/dynamic/private';

function readString(key: string, defaultValue: string): string {
  const v = env[key];
  return v !== undefined && v !== '' ? v : defaultValue;
}

function readPositiveInt(key: string, defaultValue: number): number {
  const raw = env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

function readOptionalPositiveInt(key: string): number | null {
  const raw = env[key];
  if (raw === undefined || raw === '') return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function getFlashModel(): string {
  return readString('FLASH_MODEL', 'gemini-2.5-flash');
}

/**
 * ConstrainedFlow: set to a positive integer (e.g. 15000) for paced Flash calls + 429 retries.
 * UnconstrainedFlow: unset or empty — no pacing, no retry wrapper.
 */
export function getFlashGenerationMinIntervalMs(): number | null {
  return readOptionalPositiveInt('FLASH_GENERATION_MIN_INTERVAL_MS');
}

export function getEmbeddingModel(): string {
  return readString('EMBEDDING_MODEL', 'gemini-embedding-2-preview');
}

export function getEmbeddingDimension(): number {
  return readPositiveInt('EMBEDDING_DIMENSION', 768);
}
