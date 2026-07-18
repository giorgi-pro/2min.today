import { logger } from "@2min.today/logging";
import type {
  ClassifiedCluster,
  SummarizedCluster,
  Topic,
} from "@2min.today/types";
import { getClassifySimilarityThreshold } from "@lib/server/digest/models";
import type { Pool } from "pg";
import { fromSql } from "pgvector";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function classifyClusters(
  clusters: SummarizedCluster[],
  db: Pool,
): Promise<ClassifiedCluster[]> {
  if (clusters.length === 0) return [];

  const t0 = Date.now();
  logger.info({ clusterCount: clusters.length }, "classify start");

  // vector columns come back as text ("[0.1,...]"); parse to number[] via fromSql.
  const { rows } = await db.query<{ topic: string; embedding: string }>(
    "select topic, embedding::text as embedding from topic_anchors",
  );

  if (!rows.length) {
    throw new Error("Failed to load topic anchors: no rows");
  }

  const anchors = rows.map((r) => ({
    topic: r.topic as Topic,
    embedding: fromSql(r.embedding) as number[],
  }));

  logger.info({ anchorCount: anchors.length }, "classify anchors loaded");

  const similarityThreshold = getClassifySimilarityThreshold();
  const results: ClassifiedCluster[] = [];

  for (const [clusterIndex, cluster] of clusters.entries()) {
    let bestTopic: Topic = anchors[0]?.topic ?? "society";
    let bestSim = -1;

    for (const anchor of anchors) {
      const sim = cosineSimilarity(cluster.centroidEmbedding, anchor.embedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestTopic = anchor.topic;
      }
    }

    // At/above threshold trust the anchor match; below, prefer the LLM's topic
    // hint and fall back to the closest anchor.
    const topic: Topic =
      bestSim >= similarityThreshold
        ? bestTopic
        : (cluster.llmTopic ?? bestTopic);

    logger.debug(
      {
        clusterIndex,
        bestTopic,
        bestSim,
        llmTopic: cluster.llmTopic,
        chosen: topic,
      },
      "classify topic",
    );

    results.push({ ...cluster, topic });
  }

  logger.info(
    { classifiedCount: results.length, durationMs: Date.now() - t0 },
    "classify complete",
  );
  return results;
}
