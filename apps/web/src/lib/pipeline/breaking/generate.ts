import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import type { BreakingCandidate } from '$lib/types/breaking';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object' as const,
      properties: {
        headline: { type: 'string' as const },
        bullets: { type: 'array' as const, items: { type: 'string' as const }, minItems: 2, maxItems: 2 },
      },
      required: ['headline', 'bullets'],
    },
  },
});

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
  const result = await model.generateContent(prompt(candidate.title));
  return JSON.parse(result.response.text()) as { headline: string; bullets: [string, string] };
}
