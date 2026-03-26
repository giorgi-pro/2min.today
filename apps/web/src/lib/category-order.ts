import type { Bucket } from '$lib/config/buckets.constants';
import { BUCKET_ORDER } from '$lib/config/buckets.constants';

export const CATEGORY_ORDER_STORAGE_KEY = '2min.today/category-order';

const bucketSet = new Set<string>(BUCKET_ORDER);

export function resolveCategoryOrder(saved: string[] | null | undefined, present: Bucket[]): Bucket[] {
  const presentSet = new Set(present);
  if (!saved?.length) return [...present];
  const out: Bucket[] = [];
  const used = new Set<Bucket>();
  for (const x of saved) {
    const b = x as Bucket;
    if (presentSet.has(b) && bucketSet.has(b)) {
      out.push(b);
      used.add(b);
    }
  }
  for (const b of BUCKET_ORDER) {
    if (presentSet.has(b) && !used.has(b)) out.push(b);
  }
  return out;
}

export function reorderCategoryBuckets(order: Bucket[], from: Bucket, onto: Bucket): Bucket[] {
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
