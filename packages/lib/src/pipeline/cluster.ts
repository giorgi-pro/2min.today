import { v4 as uuidv4 } from "uuid";
import { getClusterSimilarityThreshold } from "@lib/server/digest/models";
import type { EmbeddedItem, Cluster } from "@2min.today/types";

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

function computeCentroid(items: EmbeddedItem[]): number[] {
  const dim = items[0]?.embedding.length ?? 0;
  const centroid = new Array<number>(dim).fill(0);
  for (const item of items) {
    for (let i = 0; i < dim; i++)
      centroid[i] = (centroid[i] ?? 0) + (item.embedding[i] ?? 0);
  }
  for (let i = 0; i < dim; i++) centroid[i] = (centroid[i] ?? 0) / items.length;
  return centroid;
}

export async function clusterItems(items: EmbeddedItem[]): Promise<Cluster[]> {
  if (items.length === 0) return [];

  const similarityThreshold = getClusterSimilarityThreshold();
  const clusters: Cluster[] = [];

  for (const item of items) {
    let bestIdx = -1;
    let bestSim = -1;

    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      if (!c) continue;
      const sim = cosineSimilarity(item.embedding, c.centroidEmbedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    const best = bestIdx !== -1 ? clusters[bestIdx] : undefined;
    if (bestSim >= similarityThreshold && best) {
      best.items.push(item);
      best.centroidEmbedding = computeCentroid(best.items);
    } else {
      clusters.push({
        id: uuidv4(),
        items: [item],
        centroidEmbedding: [...item.embedding],
      });
    }
  }

  return clusters;
}
