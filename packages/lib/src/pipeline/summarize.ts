import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Logger } from 'pino';
import { env } from '@2min.today/config/env';
import { withFlashGenerationRetry } from '@lib/server/digest/flash-generate';
import {
  getDigestSummarizeMaxClusters,
  getFlashModel,
  mergeFlashGenerationConfig,
} from '@lib/server/digest/models';
import { silentLogger } from '@2min.today/logging';
import { parseRegion } from '@lib/types/digest';
import { BUCKET_ORDER, type Bucket } from '@lib/config/buckets.constants';
import type { Cluster, SummarizedCluster, Credit, EmbeddedItem } from '@lib/types/digest';

function extractCredits(items: EmbeddedItem[]): Credit[] {
  const seen = new Set<string>();
  const credits: Credit[] = [];
  for (const item of items) {
    if (item.url && !seen.has(item.url)) {
      seen.add(item.url);
      credits.push({ source: item.source, url: item.url });
    }
  }
  return credits;
}

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

export async function summarizeClusters(clusters: Cluster[], log?: Logger): Promise<SummarizedCluster[]> {
  const l = log ?? silentLogger;
  if (clusters.length === 0) return [];

  const maxClusters = getDigestSummarizeMaxClusters();
  const toSummarize = maxClusters != null ? clusters.slice(0, maxClusters) : clusters;
  if (maxClusters != null && clusters.length > toSummarize.length) {
    l.info(
      { totalClusters: clusters.length, summarizing: toSummarize.length, limit: maxClusters },
      'summarize capped by DIGEST_SUMMARIZE_MAX_CLUSTERS',
    );
  }

  const t0 = Date.now();
  l.info({ clusterCount: toSummarize.length, model: getFlashModel() }, 'summarize start');

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? '');
  const model = genAI.getGenerativeModel({
    model: getFlashModel(),
    generationConfig: mergeFlashGenerationConfig({
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING },
          bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          whyItMatters: { type: SchemaType.STRING },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          region: { type: SchemaType.STRING },
          bucket: { type: SchemaType.STRING },
        },
        required: ['headline', 'bullets', 'whyItMatters', 'tags', 'region', 'bucket'],
      },
    }),
  });

  const results: SummarizedCluster[] = [];

  for (const [clusterIndex, cluster] of toSummarize.entries()) {
    l.debug({ clusterIndex, clusterId: cluster.id }, 'summarize cluster');

    const prompt = `You are a brutalist news editor for 2min.today.

Cluster of reports:
${JSON.stringify(cluster.items.map((i) => ({ title: i.title, content: i.content.slice(0, 800) })))}

Return ONLY valid JSON matching this schema:
{
  "headline": "max 12 words",
  "bullets": ["exactly 3 bullets, max 25 words each"],
  "whyItMatters": "max 30 words",
  "tags": ["3-5 single-word or short-phrase keywords, e.g. fed-rate, nvidia-chip, ai-regulation"],
  "region": "one of: world, europe, americas, middle-east, usa",
  "bucket": "one of: usa, europe, middle-east, americas, world, business, tech, science, health, sports"
}

Tone: dense, zero fluff, future-facing. Tags must be precise and reusable across days.

For "region", assign exactly one of: world, europe, americas, middle-east, usa.
Rules: "usa" = US-domestic stories only. "americas" = multi-country Americas or non-US Americas countries. "middle-east" = MENA. "europe" = Europe/EU/UK. "world" = worldwide scope or unclear geography.

For "bucket", use geography-first, topic-override classification:
STEP 1 — Check topic overrides first. If the story is primarily about one of these topics, use the topic bucket regardless of geography:
  "business" = financial markets, economy, corporate earnings, monetary policy, trade, tariffs, currency
  "tech" = technology, AI, software, hardware, cybersecurity, startups
  "science" = scientific research, space, climate science
  "health" = medicine, public health, wellness, lifestyle, mental health, parenting
  "sports" = sports, athletics, competitions, leagues, tournaments

STEP 2 — If no topic override applies, route by geography:
  "usa" = US-domestic politics, government, law, society, culture, crime
  "europe" = EU/UK/European politics, government, society, culture
  "middle-east" = MENA region politics, conflicts, society
  "americas" = Latin America, Canada, Caribbean politics, society
  "world" = multi-region, unclear geography, or stories that don't fit above`;

    const feedRegion = cluster.items.find((i) => i.feedRegion)?.feedRegion;

    const parsed = await withFlashGenerationRetry(async () => {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as {
        headline: string;
        bullets: string[];
        whyItMatters: string;
        tags?: unknown;
        region?: unknown;
        bucket?: unknown;
      };
    });

    const rawBucket = typeof parsed.bucket === 'string' ? parsed.bucket.toLowerCase().trim() : null;
    const llmBucket = rawBucket && (BUCKET_ORDER as string[]).includes(rawBucket) ? (rawBucket as Bucket) : null;

    results.push({
      ...cluster,
      headline: parsed.headline,
      bullets: parsed.bullets.slice(0, 3),
      whyItMatters: parsed.whyItMatters,
      tags: normalizeSummaryTags(parsed.tags),
      region: feedRegion ?? parseRegion(parsed.region),
      credits: extractCredits(cluster.items),
      llmBucket,
    });
  }

  l.info({ summarizedCount: results.length, durationMs: Date.now() - t0 }, 'summarize complete');
  return results;
}
