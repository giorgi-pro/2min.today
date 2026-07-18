import type { ClassifiedCluster } from "@2min.today/types";
import type { Pool } from "pg";
import { toSql } from "pgvector";

const COLS_PER_ROW = 7;

export async function upsertClusters(
  clusters: ClassifiedCluster[],
  db: Pool,
): Promise<ClassifiedCluster[]> {
  if (clusters.length === 0) return [];

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const publishedAt = new Date().toISOString();

  const rowPlaceholders: string[] = [];
  const values: unknown[] = [];
  clusters.forEach((c, i) => {
    const o = i * COLS_PER_ROW;
    rowPlaceholders.push(
      `($${o + 1}, $${o + 2}::vector, $${o + 3}::jsonb, $${o + 4}::jsonb, $${o + 5}, $${o + 6}, $${o + 7})`,
    );
    values.push(
      c.id,
      toSql(c.centroidEmbedding),
      JSON.stringify(c.items),
      JSON.stringify({
        headline: c.headline,
        bullets: c.bullets,
        why_it_matters: c.whyItMatters,
        tags: c.tags,
        region: c.region,
        credits: c.credits,
      }),
      c.region,
      c.topic,
      publishedAt,
    );
  });

  // Clear today's UTC window and write the new set atomically.
  const client = await db.connect();
  try {
    await client.query("begin");
    await client.query(
      "delete from clusters where published_at >= $1 and published_at < $2",
      [todayStart.toISOString(), todayEnd.toISOString()],
    );
    await client.query(
      `insert into clusters (id, embedding, raw_items, summary, region, topic, published_at)
       values ${rowPlaceholders.join(", ")}
       on conflict (id) do update set
         embedding = excluded.embedding,
         raw_items = excluded.raw_items,
         summary = excluded.summary,
         region = excluded.region,
         topic = excluded.topic,
         published_at = excluded.published_at`,
      values,
    );
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw new Error(
      `Upsert failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  } finally {
    client.release();
  }

  return clusters;
}
