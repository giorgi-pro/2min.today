import type { Topic } from "@2min.today/types";
import { TOPIC_ORDER, TOPIC_ORDER_SET } from "@2min.today/types";

export const CATEGORY_ORDER_STORAGE_KEY = "2min.today/category-order";
export const CATEGORY_MINIMIZED_STORAGE_KEY = "2min.today/category-minimized";

export function normalizeStoredTopicKey(raw: string): Topic | null {
  const lower = raw.toLowerCase().trim();
  if (TOPIC_ORDER_SET.has(lower)) return lower as Topic;
  return null;
}

export function resolveCategoryOrder(
  saved: string[] | null | undefined,
  present: Topic[],
): Topic[] {
  const presentSet = new Set(present);
  if (!saved?.length) return [...present];
  const out: Topic[] = [];
  const used = new Set<Topic>();
  for (const x of saved) {
    const t = x as Topic;
    if (presentSet.has(t) && TOPIC_ORDER_SET.has(t)) {
      out.push(t);
      used.add(t);
    }
  }
  for (const t of TOPIC_ORDER) {
    if (presentSet.has(t) && !used.has(t)) out.push(t);
  }
  return out;
}

export function reorderCategoryTopics(
  order: Topic[],
  from: Topic,
  onto: Topic,
): Topic[] {
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
