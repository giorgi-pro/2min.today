import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { FLASH_MODEL } from '$lib/server/digest/models';
import { parseRegion } from '$lib/types/digest';
import type { Cluster, SummarizedCluster } from '$lib/types/digest';

const MAX_RETRIES = 3;

function normalizeSummaryTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const t = x.trim();
    if (t) out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let delay = 1000;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt === MAX_RETRIES - 1) throw e;
      if (e?.status === 429 || e?.message?.includes('rate')) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      } else {
        throw e;
      }
    }
  }
  throw new Error('Unreachable');
}

export async function summarizeClusters(clusters: Cluster[]): Promise<SummarizedCluster[]> {
  if (clusters.length === 0) return [];

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({
    model: FLASH_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          whyItMatters: { type: SchemaType.STRING },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          region: { type: SchemaType.STRING },
        },
        required: ['headline', 'bullets', 'whyItMatters', 'tags', 'region'],
      },
    },
  });

  const results: SummarizedCluster[] = [];

  for (const cluster of clusters) {
    const prompt = `You are a brutalist news editor for 2min.today.

Cluster of reports:
${JSON.stringify(cluster.items.map((i) => ({ title: i.title, content: i.content.slice(0, 800) })))}

Return ONLY valid JSON matching this schema:
{
  "headline": "max 12 words",
  "bullets": ["exactly 3 bullets, max 25 words each"],
  "whyItMatters": "max 30 words",
  "tags": ["3-5 single-word or short-phrase keywords, e.g. fed-rate, nvidia-chip, ai-regulation"]
}

Tone: dense, zero fluff, future-facing. Tags must be precise and reusable across days.

For "region", assign exactly one of: global, europe, americas, middle-east, usa.
Rules: "usa" = US-domestic stories only. "americas" = multi-country Americas or non-US Americas countries. "middle-east" = MENA. "europe" = Europe/EU/UK. Default to "global" if unclear, or for tech/science/health with no primary geographic anchor.`;

    const feedRegion = cluster.items.find((i) => i.feedRegion)?.feedRegion;

    const parsed = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as {
        headline: string;
        bullets: string[];
        whyItMatters: string;
        tags?: unknown;
        region?: unknown;
      };
    });

    results.push({
      ...cluster,
      headline: parsed.headline,
      bullets: parsed.bullets.slice(0, 3),
      whyItMatters: parsed.whyItMatters,
      tags: normalizeSummaryTags(parsed.tags),
      region: feedRegion ?? parseRegion(parsed.region),
    });
  }

  return results;
}
