import fs from "fs";
import path from "path";
import { parse } from "yaml";

export type { Bucket } from "./buckets.constants";
export { BUCKET_ORDER } from "./buckets.constants";

const raw = fs.readFileSync(
  path.join(process.cwd(), "src/lib/config/buckets.yaml"),
  "utf8",
);
export const BUCKET_ANCHORS = parse(raw).buckets as Record<string, string>;
