import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '@2min.today/config/env';
import { withFlashGenerationRetry } from '@lib/server/digest/flash-generate';
import { getFlashModel, mergeFlashGenerationConfig } from '@lib/server/digest/models';
import type { BreakingCandidate } from '@lib/types/breaking';

function breakingFlashModel() {
  return new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
    model: getFlashModel(),
    generationConfig: mergeFlashGenerationConfig({
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING },
          bullets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            minItems: 2,
            maxItems: 2,
          },
        },
        required: ['headline', 'bullets'],
      },
    }),
  });
}

const prompt = (title: string) =>
  `You are a wire editor writing a breaking news flash for 2min.today.

Raw headline: "${title}"

Return ONLY valid JSON:
{
  "headline": "max 10 words, present tense, factual",
  "bullets": ["exactly 2 bullets, max 20 words each, confirmed facts only"]
}

Tone: urgent, zero speculation, no padding.`;

export async function generateLiveCard(
  candidate: BreakingCandidate,
): Promise<{ headline: string; bullets: [string, string] }> {
  return withFlashGenerationRetry(async () => {
    const result = await breakingFlashModel().generateContent(prompt(candidate.title));
    return JSON.parse(result.response.text()) as { headline: string; bullets: [string, string] };
  });
}
