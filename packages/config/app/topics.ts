import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "yaml";

export type { Topic } from "../../types/topics";
export { TOPIC_ORDER } from "../../types/topics";

// Resolve the YAML next to this module so it works regardless of cwd.
const here = path.dirname(fileURLToPath(import.meta.url));
const raw = fs.readFileSync(path.join(here, "topics.yaml"), "utf8");
export const TOPIC_ANCHORS = parse(raw).topics as Record<string, string>;
