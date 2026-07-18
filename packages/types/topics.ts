// Topic = what a story is about (subject). Orthogonal to Region (where).
export type Topic =
  | "politics"
  | "conflict"
  | "business"
  | "tech"
  | "science"
  | "health"
  | "environment"
  | "society";

export const TOPIC_ORDER: Topic[] = [
  "politics",
  "conflict",
  "business",
  "tech",
  "science",
  "health",
  "environment",
  "society",
];

export const TOPIC_ORDER_SET = new Set<string>(TOPIC_ORDER);

// Human-facing row labels. Slugs stay short/stable in code and DB; the UI shows these.
export const TOPIC_LABELS: Record<Topic, string> = {
  politics: "Politics & Policy",
  conflict: "Conflict & Security",
  business: "Business & Economy",
  tech: "Technology",
  science: "Science",
  health: "Health",
  environment: "Environment & Energy",
  society: "Society & Culture",
};

// Map older/looser values (previous 10-bucket scheme, capitalized labels) to a topic.
export const LEGACY_TOPIC: Record<string, Topic> = {
  business: "business",
  tech: "tech",
  science: "science",
  health: "health",
  sports: "society",
  // old geographic buckets are now regions, not topics; route to a sensible topic
  usa: "politics",
  americas: "politics",
  europe: "politics",
  "middle-east": "conflict",
  world: "society",
  emerging: "society",
  Business: "business",
  Tech: "tech",
  Science: "science",
  Health: "health",
  Sports: "society",
};

export function parseTopic(value: unknown): Topic {
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (TOPIC_ORDER_SET.has(lower)) return lower as Topic;
    const legacy = LEGACY_TOPIC[value] ?? LEGACY_TOPIC[lower];
    if (legacy) return legacy;
  }
  return "society";
}
