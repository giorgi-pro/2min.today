import { env } from "@2min.today/config/env";
import { TOPIC_ANCHORS } from "@2min.today/config/app/topics";
import { getDb } from "@2min.today/data/db";
import type { EmbedRequest } from "@2min.today/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toSql } from "pgvector";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const db = getDb();

/** Node's fetch reports "fetch failed" and puts the real reason in `.cause`. Walk it. */
function describeError(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  let depth = 0;
  while (current && depth < 5) {
    if (current instanceof Error) {
      const code = (current as { code?: string }).code;
      parts.push(`${current.name}: ${current.message}${code ? ` (${code})` : ""}`);
      current = (current as { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
    depth++;
  }
  return parts.join(" <- caused by: ");
}

async function seedAnchors() {
  console.log(`Seeding topic anchors against ${env.DATABASE_URL}`);
  const model = genAI.getGenerativeModel({ model: env.EMBEDDING_MODEL });
  let failed = 0;
  for (const [topic, text] of Object.entries(TOPIC_ANCHORS)) {
    const req: EmbedRequest = {
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: env.EMBEDDING_DIMENSION,
    };

    try {
      const result = await model.embedContent(req);
      const embedding = result.embedding.values;

      await db.query(
        `insert into topic_anchors (topic, embedding) values ($1, $2::vector)
         on conflict (topic) do update set embedding = excluded.embedding`,
        [topic, toSql(embedding)],
      );

      console.log(`Seeded ${topic}`);
    } catch (err) {
      failed++;
      console.error(`Failed to seed ${topic}:`, describeError(err));
    }
  }

  if (failed > 0) {
    console.error(`\n${failed}/${Object.keys(TOPIC_ANCHORS).length} anchors failed to seed.`);
    process.exitCode = 1;
    return;
  }
  console.log("All topic anchors seeded.");
}

seedAnchors()
  .catch((err) => {
    console.error("seed failed:", describeError(err));
    process.exitCode = 1;
  })
  .finally(() => db.end());
