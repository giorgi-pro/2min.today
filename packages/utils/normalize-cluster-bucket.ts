import type { Bucket } from "@2min.today/types";
import { BUCKET_ORDER_SET, LEGACY_CLUSTER_BUCKET } from "@2min.today/types";

export function normalizeClusterBucket(raw: string | null | undefined): Bucket {
  const s = raw?.trim() ?? "";
  const lower = s.toLowerCase();
  if (BUCKET_ORDER_SET.has(lower)) return lower as Bucket;
  const legacy = LEGACY_CLUSTER_BUCKET[s];
  if (legacy) return legacy;
  if (lower === "global" || lower === "emerging") return "world";
  return "world";
}
