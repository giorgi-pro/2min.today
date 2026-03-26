import type { EmbedContentRequest } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from '$lib/server/digest/models';
import type { RawItem, EmbeddedItem } from '$lib/types/digest';

type EmbedRequest = EmbedContentRequest & { outputDimensionality?: number };

const BATCH_SIZE = 20;

export async function embedItems(items: RawItem[]): Promise<EmbeddedItem[]> {
  if (items.length === 0) return [];

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const embedded: EmbeddedItem[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (item) => {
        const req: EmbedRequest = {
          content: { role: 'user', parts: [{ text: `${item.title}\n${item.content}` }] },
          outputDimensionality: EMBEDDING_DIMENSION,
        };
        const result = await model.embedContent(req);
        return { ...item, embedding: result.embedding.values };
      }),
    );

    embedded.push(...results);
  }

  return embedded;
}
