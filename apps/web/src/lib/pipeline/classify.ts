import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { FLASH_MODEL } from '$lib/server/digest/models';
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

const SIMILARITY_THRESHOLD = 0.65;

export async function classifyClusters(
  clusters: SummarizedCluster[],
  supabase: SupabaseClient,
): Promise<ClassifiedCluster[]> {
  if (clusters.length === 0) return [];

  const { data: anchors, error } = await supabase.from('bucket_anchors').select('bucket, embedding');

  if (error || !anchors?.length) {
    throw new Error(`Failed to load bucket anchors: ${error?.message ?? 'no rows'}`);
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({ model: FLASH_MODEL });

  const results: ClassifiedCluster[] = [];

  for (const cluster of clusters) {
    let bestBucket = '';
    let bestSim = -1;

    for (const anchor of anchors) {
      const sim = cosineSimilarity(cluster.centroidEmbedding, anchor.embedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestBucket = anchor.bucket;
      }
    }

    if (bestSim >= SIMILARITY_THRESHOLD) {
      results.push({
        ...cluster,
        bucket: bestBucket as Bucket,
        categoryLine: null,
      });
    } else {
      const prompt = `Generate a concise category label (max 8 words) for this news cluster:\n\nHeadline: ${cluster.headline}\nBullets: ${cluster.bullets.join('; ')}\n\nReturn ONLY the label, no quotes, no explanation.`;

      const result = await model.generateContent(prompt);
      const categoryLine = result.response.text().trim().slice(0, 80);

      results.push({
        ...cluster,
        bucket: 'Emerging' as Bucket,
        categoryLine,
      });
    }
  }

  return results;
}
