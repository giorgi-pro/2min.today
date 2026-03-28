import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassifiedCluster } from "@lib/types/digest";

export async function upsertClusters(
  clusters: ClassifiedCluster[],
  supabase: SupabaseClient,
): Promise<ClassifiedCluster[]> {
  if (clusters.length === 0) return [];

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  await supabase
    .from("clusters")
    .delete()
    .gte("published_at", todayStart.toISOString())
    .lt("published_at", todayEnd.toISOString());

  const { error } = await supabase.from("clusters").upsert(
    clusters.map((c) => ({
      id: c.id,
      embedding: c.centroidEmbedding,
      raw_items: c.items,
      summary: {
        headline: c.headline,
        bullets: c.bullets,
        why_it_matters: c.whyItMatters,
        tags: c.tags,
        region: c.region,
        credits: c.credits,
      },
      bucket: c.bucket,
      category_line: c.categoryLine,
      published_at: new Date().toISOString(),
    })),
    { onConflict: "id" },
  );

  if (error) throw new Error(`Upsert failed: ${error.message}`);

  return clusters;
}
