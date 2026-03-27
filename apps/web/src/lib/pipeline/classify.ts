import type { Logger } from 'pino';
import { getClassifySimilarityThreshold } from '$lib/server/digest/models';
import { silentLogger } from '$lib/server/digest/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Bucket } from '$lib/config/buckets';
import type { SummarizedCluster, ClassifiedCluster } from '$lib/types/digest';

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
  log?: Logger,
): Promise<ClassifiedCluster[]> {
  const l = log ?? silentLogger;
  if (clusters.length === 0) return [];

  const t0 = Date.now();
  l.info({ clusterCount: clusters.length }, 'classify start');

  const { data: anchors, error } = await supabase.from('bucket_anchors').select('bucket, embedding');

  if (error || !anchors?.length) {
    throw new Error(`Failed to load bucket anchors: ${error?.message ?? 'no rows'}`);
  }

  l.info({ anchorCount: anchors.length }, 'classify anchors loaded');

  const similarityThreshold = getClassifySimilarityThreshold();
  const results: ClassifiedCluster[] = [];

  for (const [clusterIndex, cluster] of clusters.entries()) {
    let bestBucket = '';
    let bestSim = -1;

    for (const anchor of anchors) {
      const sim = cosineSimilarity(cluster.centroidEmbedding, anchor.embedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestBucket = anchor.bucket;
      }
    }

    if (bestSim >= similarityThreshold) {
      l.debug({ clusterIndex, bestBucket, bestSim }, 'classify embedding match');
      results.push({ ...cluster, bucket: bestBucket as Bucket, categoryLine: null });
    } else {
      const fallback = cluster.llmBucket ?? 'world';
      l.debug({ clusterIndex, bestSim, llmBucket: cluster.llmBucket, fallback }, 'classify llm fallback');
      results.push({ ...cluster, bucket: fallback as Bucket, categoryLine: null });
    }
  }

  l.info({ classifiedCount: results.length, durationMs: Date.now() - t0 }, 'classify complete');
  return results;
}
