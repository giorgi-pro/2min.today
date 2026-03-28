import { digestLogger } from "@2min.today/logging";
import type {
  Bucket,
  ClassifiedCluster,
  SummarizedCluster,
} from "@2min.today/types";
import { getClassifySimilarityThreshold } from "@lib/server/digest/models";
import type { SupabaseClient } from "@supabase/supabase-js";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function classifyClusters(
  clusters: SummarizedCluster[],
  supabase: SupabaseClient,
): Promise<ClassifiedCluster[]> {
  if (clusters.length === 0) return [];

  const t0 = Date.now();
  digestLogger.info({ clusterCount: clusters.length }, "classify start");

  const { data: anchors, error } = await supabase
    .from("bucket_anchors")
    .select("bucket, embedding");

  if (error || !anchors?.length) {
    throw new Error(
      `Failed to load bucket anchors: ${error?.message ?? "no rows"}`,
    );
  }

  digestLogger.info({ anchorCount: anchors.length }, "classify anchors loaded");

  const similarityThreshold = getClassifySimilarityThreshold();
  const results: ClassifiedCluster[] = [];

  for (const [clusterIndex, cluster] of clusters.entries()) {
    let bestBucket = "";
    let bestSim = -1;

    for (const anchor of anchors) {
      const sim = cosineSimilarity(cluster.centroidEmbedding, anchor.embedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestBucket = anchor.bucket;
      }
    }

    if (bestSim >= similarityThreshold) {
      digestLogger.debug(
        { clusterIndex, bestBucket, bestSim },
        "classify embedding match",
      );
      results.push({
        ...cluster,
        bucket: bestBucket as Bucket,
        categoryLine: null,
      });
    } else {
      const fallback = cluster.llmBucket ?? "world";
      digestLogger.debug(
        { clusterIndex, bestSim, llmBucket: cluster.llmBucket, fallback },
        "classify llm fallback",
      );
      results.push({
        ...cluster,
        bucket: fallback as Bucket,
        categoryLine: null,
      });
    }
  }

  digestLogger.info(
    { classifiedCount: results.length, durationMs: Date.now() - t0 },
    "classify complete",
  );
  return results;
}
