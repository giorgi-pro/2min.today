import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { EMBEDDING_MODEL } from '$lib/server/digest/models';
import type { RawItem, EmbeddedItem } from '$lib/types/digest';

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
        const result = await model.embedContent(`${item.title}\n${item.content}`);
        return { ...item, embedding: result.embedding.values };
      }),
    );

    embedded.push(...results);
  }

  return embedded;
}
