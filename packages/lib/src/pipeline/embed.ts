import type { EmbedContentRequest } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Logger } from 'pino';
import { env } from '$env/dynamic/private';
import { getEmbeddingDimension, getEmbeddingModel } from '@lib/server/digest/models';
import { silentLogger } from '@lib/server/digest/logger';
import type { RawItem, EmbeddedItem } from '@lib/types/digest';

type EmbedRequest = EmbedContentRequest & { outputDimensionality?: number };

const BATCH_SIZE = 20;

export async function embedItems(items: RawItem[], log?: Logger): Promise<EmbeddedItem[]> {
  const l = log ?? silentLogger;
  if (items.length === 0) return [];

  const t0 = Date.now();
  l.info({ itemCount: items.length, batchSize: BATCH_SIZE }, 'embed start');

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({ model: getEmbeddingModel() });

  const embedded: EmbeddedItem[] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    l.debug({ batchIndex: i / BATCH_SIZE, batchLen: batch.length }, 'embed batch');

    const results = await Promise.all(
      batch.map(async (item) => {
        const req: EmbedRequest = {
          content: { role: 'user', parts: [{ text: `${item.title}\n${item.content}` }] },
          outputDimensionality: getEmbeddingDimension(),
        };
        const result = await model.embedContent(req);
        return { ...item, embedding: result.embedding.values };
      }),
    );

    embedded.push(...results);
  }

  l.info({ embeddedCount: embedded.length, durationMs: Date.now() - t0 }, 'embed complete');
  return embedded;
}
