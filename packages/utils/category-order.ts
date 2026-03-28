import type { Bucket } from "@2min.today/types";
import { BUCKET_ORDER, DIGEST_DISPLAY_BUCKETS } from "@2min.today/types";

export const CATEGORY_ORDER_STORAGE_KEY = "2min.today/category-order";
export const CATEGORY_MINIMIZED_STORAGE_KEY = "2min.today/category-minimized";

const displayBucketSet = new Set<string>(DIGEST_DISPLAY_BUCKETS);
const bucketKeySet = new Set<string>(BUCKET_ORDER);

const LEGACY_BUCKET_KEYS: Record<string, Bucket> = {
  World: "world",
  Business: "business",
  Tech: "tech",
  Science: "science",
  Health: "health",
  Sports: "sports",
  USA: "usa",
  Europe: "europe",
  Americas: "americas",
};

export function normalizeStoredBucketKey(raw: string): Bucket | null {
  if (bucketKeySet.has(raw)) return raw as Bucket;
  return LEGACY_BUCKET_KEYS[raw] ?? null;
}

export function resolveCategoryOrder(
  saved: string[] | null | undefined,
  present: Bucket[],
): Bucket[] {
  const presentSet = new Set(present);
  if (!saved?.length) return [...present];
  const out: Bucket[] = [];
  const used = new Set<Bucket>();
  for (const x of saved) {
    const b = x as Bucket;
    if (presentSet.has(b) && displayBucketSet.has(b)) {
      out.push(b);
      used.add(b);
    }
  }
  for (const b of DIGEST_DISPLAY_BUCKETS) {
    if (presentSet.has(b) && !used.has(b)) out.push(b);
  }
  return out;
}

export function reorderCategoryBuckets(
  order: Bucket[],
  from: Bucket,
  onto: Bucket,
): Bucket[] {
  if (from === onto) return order;
  const fromIdx = order.indexOf(from);
  const ontoIdx = order.indexOf(onto);
  if (fromIdx === -1 || ontoIdx === -1) return order;
  const next = [...order];
  next.splice(fromIdx, 1);
  const ontoIdx2 = next.indexOf(onto);
  if (fromIdx < ontoIdx) {
    next.splice(ontoIdx2 + 1, 0, from);
  } else {
    next.splice(ontoIdx2, 0, from);
  }
  return next;
}
