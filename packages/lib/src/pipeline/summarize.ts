import { env } from "@2min.today/config/env";
import { logger } from "@2min.today/logging";
import type {
  Cluster,
  Credit,
  EmbeddedItem,
  SummarizedCluster,
} from "@2min.today/types";
import { TOPIC_ORDER, parseRegion, type Topic } from "@2min.today/types";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { withFlashGenerationRetry } from "@lib/server/digest/flash-generate";
import {
  getDigestSummarizeMaxClusters,
  getFlashModel,
  mergeFlashGenerationConfig,
} from "@lib/server/digest/models";

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
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (t) out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

export async function summarizeClusters(
  clusters: Cluster[],
): Promise<SummarizedCluster[]> {
  if (clusters.length === 0) return [];

  const maxClusters = getDigestSummarizeMaxClusters();
  const toSummarize =
    maxClusters != null ? clusters.slice(0, maxClusters) : clusters;
  if (maxClusters != null && clusters.length > toSummarize.length) {
    logger.info(
      {
        totalClusters: clusters.length,
        summarizing: toSummarize.length,
        limit: maxClusters,
      },
      "summarize capped by DIGEST_SUMMARIZE_MAX_CLUSTERS",
    );
  }

  const t0 = Date.now();
  logger.info(
    { clusterCount: toSummarize.length, model: getFlashModel() },
    "summarize start",
  );

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? "");
  const model = genAI.getGenerativeModel({
    model: getFlashModel(),
    generationConfig: mergeFlashGenerationConfig({
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING },
          bullets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          whyItMatters: { type: SchemaType.STRING },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          region: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
        },
        required: [
          "headline",
          "bullets",
          "whyItMatters",
          "tags",
          "region",
          "topic",
        ],
      },
    }),
  });

  const results: SummarizedCluster[] = [];

  for (const [clusterIndex, cluster] of toSummarize.entries()) {
    logger.debug(
      { clusterIndex, clusterId: cluster.id },
      "summarize cluster",
    );

    const prompt = `You are a brutalist news editor for 2min.today.

Cluster of reports:
${JSON.stringify(cluster.items.map((i) => ({ title: i.title, content: i.content.slice(0, 800) })))}

Return ONLY valid JSON matching this schema:
{
  "headline": "max 12 words",
  "bullets": ["exactly 3 bullets, max 25 words each"],
  "whyItMatters": "max 30 words",
  "tags": ["3-5 single-word or short-phrase keywords, e.g. fed-rate, nvidia-chip, ai-regulation"],
  "region": "one of: usa, europe, middle-east, americas, asia, africa, world",
  "topic": "one of: politics, conflict, business, tech, science, health, environment, society"
}

Tone: dense, zero fluff, future-facing. Tags must be precise and reusable across days.

Region and topic are INDEPENDENT. Assign both. Region = where it happened. Topic = what it is about.

For "region", where the story primarily takes place:
  "usa" = United States. "europe" = Europe/EU/UK. "middle-east" = MENA.
  "americas" = Latin America, Canada, Caribbean (non-US). "asia" = Asia-Pacific incl. China, India, Japan.
  "africa" = Sub-Saharan Africa. "world" = global scope, multiple regions, or unclear geography.

For "topic", the subject matter (pick the single best fit):
  "politics" = government, elections, legislation, diplomacy, policy
  "conflict" = war, military, defense, terrorism, security, geopolitics
  "business" = economy, markets, trade, companies, jobs, finance
  "tech" = technology, AI, software, hardware, cybersecurity
  "science" = research, space, physics, biology, discoveries
  "health" = medicine, public health, disease, healthcare
  "environment" = climate, energy, natural disasters, conservation
  "society" = culture, education, rights, migration, crime, justice, human interest`;

    const feedRegion = cluster.items.find((i) => i.feedRegion)?.feedRegion;

    const parsed = await withFlashGenerationRetry(async () => {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as {
        headline: string;
        bullets: string[];
        whyItMatters: string;
        tags?: unknown;
        region?: unknown;
        topic?: unknown;
      };
    });

    const rawTopic =
      typeof parsed.topic === "string"
        ? parsed.topic.toLowerCase().trim()
        : null;
    const llmTopic =
      rawTopic && (TOPIC_ORDER as string[]).includes(rawTopic)
        ? (rawTopic as Topic)
        : null;

    results.push({
      ...cluster,
      headline: parsed.headline,
      bullets: parsed.bullets.slice(0, 3),
      whyItMatters: parsed.whyItMatters,
      tags: normalizeSummaryTags(parsed.tags),
      region: feedRegion ?? parseRegion(parsed.region),
      credits: extractCredits(cluster.items),
      llmTopic,
    });
  }

  logger.info(
    { summarizedCount: results.length, durationMs: Date.now() - t0 },
    "summarize complete",
  );
  return results;
}
