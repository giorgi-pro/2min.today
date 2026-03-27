import { v4 as uuidv4 } from 'uuid';
import { getClusterSimilarityThreshold } from '@2min.today/lib/server/digest/models';
import type { EmbeddedItem, Cluster } from '@2min.today/lib/types/digest';

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

function computeCentroid(items: EmbeddedItem[]): number[] {
  const dim = items[0].embedding.length;
  const centroid = new Array<number>(dim).fill(0);
  for (const item of items) {
    for (let i = 0; i < dim; i++) centroid[i] += item.embedding[i];
  }
  for (let i = 0; i < dim; i++) centroid[i] /= items.length;
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
      const sim = cosineSimilarity(item.embedding, clusters[i].centroidEmbedding);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }

    if (bestSim >= similarityThreshold && bestIdx !== -1) {
      clusters[bestIdx].items.push(item);
      clusters[bestIdx].centroidEmbedding = computeCentroid(clusters[bestIdx].items);
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
