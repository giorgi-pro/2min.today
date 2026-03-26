import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { withFlashGenerationRetry } from '$lib/server/digest/flash-generate';
import { getFlashModel } from '$lib/server/digest/models';
import type { BreakingCandidate } from '$lib/types/breaking';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

function breakingFlashModel() {
  return genAI.getGenerativeModel({
    model: getFlashModel(),
    generationConfig: {
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
    },
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
