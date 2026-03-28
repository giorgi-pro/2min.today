export type Bucket =
  | "usa"
  | "europe"
  | "middle-east"
  | "americas"
  | "world"
  | "business"
  | "tech"
  | "science"
  | "health"
  | "sports";

export const GEO_BUCKETS: Bucket[] = [
  "usa",
  "europe",
  "middle-east",
  "americas",
  "world",
];
export const TOPIC_BUCKETS: Bucket[] = [
  "business",
  "tech",
  "science",
  "health",
  "sports",
];

export const DIGEST_DISPLAY_BUCKETS: Bucket[] = [
  ...GEO_BUCKETS,
  ...TOPIC_BUCKETS,
];

export const BUCKET_ORDER: Bucket[] = [...DIGEST_DISPLAY_BUCKETS];

export const BUCKET_ORDER_SET = new Set<string>(BUCKET_ORDER);

export const LEGACY_CLUSTER_BUCKET: Record<string, Bucket> = {
  World: "world",
  Business: "business",
  Tech: "tech",
  Science: "science",
  Health: "health",
  Sports: "sports",
  Emerging: "world",
  USA: "usa",
  Europe: "europe",
  Americas: "americas",
};
