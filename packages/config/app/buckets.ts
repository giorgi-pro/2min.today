import fs from "fs";
import path from "path";
import { parse } from "yaml";

export type { Bucket } from "../../types/buckets";
export { BUCKET_ORDER } from "../../types/buckets";

const raw = fs.readFileSync(
  path.join(process.cwd(), "src/lib/config/buckets.yaml"),
  "utf8",
);
export const BUCKET_ANCHORS = parse(raw).buckets as Record<string, string>;
