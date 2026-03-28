import type { GenerationConfig } from "@google/generative-ai";
import { env } from "@2min.today/config/env";

const FLASH_THINKING_LEVELS = ["MINIMAL", "LOW", "MEDIUM", "HIGH"] as const;

function readString(key: string, defaultValue: string): string {
  const v = env[key];
  return v !== undefined && v !== "" ? v : defaultValue;
}

function readPositiveInt(key: string, defaultValue: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return defaultValue;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

function readOptionalPositiveInt(key: string): number | null {
  const raw = env[key];
  if (raw === undefined || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function readOptionalFloat(key: string): number | null {
  const raw = env[key];
  if (raw === undefined || raw === "") return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

/** Any finite int including 0 and negatives (e.g. thinkingBudget -1 = dynamic). */
function readOptionalInt(key: string): number | null {
  const raw = env[key];
  if (raw === undefined || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function getFlashModel(): string {
  return readString("FLASH_MODEL", "gemini-2.5-flash");
}

/**
 * Merges env-driven Flash options into generateContent config (temperature, thinking).
 * thinkingBudget suits Gemini 2.5 (0 = minimal thinking per API docs). thinkingLevel suits Gemini 3+; may error on older models if mis-set.
 */
export function mergeFlashGenerationConfig(
  base: GenerationConfig,
): GenerationConfig {
  const temperature = readOptionalFloat("FLASH_GENERATION_TEMPERATURE");
  const thinkingBudget = readOptionalInt("FLASH_THINKING_BUDGET");
  const levelRaw = env.FLASH_THINKING_LEVEL?.trim().toUpperCase();
  const thinkingLevel =
    levelRaw && (FLASH_THINKING_LEVELS as readonly string[]).includes(levelRaw)
      ? levelRaw
      : undefined;

  const thinkingConfig =
    thinkingBudget != null || thinkingLevel != null
      ? {
          ...(thinkingBudget != null ? { thinkingBudget } : {}),
          ...(thinkingLevel != null ? { thinkingLevel } : {}),
        }
      : undefined;

  return {
    ...base,
    ...(temperature != null ? { temperature } : {}),
    ...(thinkingConfig && Object.keys(thinkingConfig).length > 0
      ? { thinkingConfig }
      : {}),
  } as GenerationConfig;
}

/**
 * ConstrainedFlow: set to a positive integer (e.g. 15000) for paced Flash calls + 429 retries.
 * UnconstrainedFlow: unset or empty — no pacing, no retry wrapper.
 */
export function getFlashGenerationMinIntervalMs(): number | null {
  return readOptionalPositiveInt("FLASH_GENERATION_MIN_INTERVAL_MS");
}

export function getEmbeddingModel(): string {
  return readString("EMBEDDING_MODEL", "gemini-embedding-2-preview");
}

export function getEmbeddingDimension(): number {
  return readPositiveInt("EMBEDDING_DIMENSION", 768);
}

/** Unset = summarize all clusters. Set (e.g. 3) to cap Flash summarize calls for debugging. */
export function getDigestSummarizeMaxClusters(): number | null {
  return readOptionalPositiveInt("DIGEST_SUMMARIZE_MAX_CLUSTERS");
}

/** Cosine similarity threshold for assigning a fixed bucket vs Emerging (0–1). Default 0.65. */
export function getClassifySimilarityThreshold(): number {
  const raw = env.CLASSIFY_SIMILARITY_THRESHOLD;
  if (raw === undefined || raw === "") return 0.65;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.65;
  return n;
}

/** Cosine similarity for merging items into the same story cluster (0–1). Default 0.85. Lower = fewer, larger clusters. */
export function getClusterSimilarityThreshold(): number {
  const raw = env.CLUSTER_SIMILARITY_THRESHOLD;
  if (raw === undefined || raw === "") return 0.85;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.85;
  return n;
}
