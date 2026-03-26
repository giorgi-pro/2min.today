import type { EmbedContentRequest } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { BUCKET_ANCHORS } from '../apps/web/src/lib/config/buckets';
import 'dotenv/config';

type EmbedRequest = EmbedContentRequest & { outputDimensionality?: number };

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-2-preview';
const EMBEDDING_DIMENSION = Number.parseInt(process.env.EMBEDDING_DIMENSION || '768', 10);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seedAnchors() {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  for (const [bucket, text] of Object.entries(BUCKET_ANCHORS)) {
    const req: EmbedRequest = {
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSION,
    };
    const result = await model.embedContent(req);
    const embedding = result.embedding.values;

    const { error } = await supabase
      .from('bucket_anchors')
      .upsert({ bucket, embedding }, { onConflict: 'bucket' });

    if (error) {
      console.error(`Failed to seed ${bucket}:`, error.message);
      continue;
    }

    console.log(`Seeded ${bucket}`);
  }
  console.log('All bucket anchors seeded.');
}

seedAnchors().catch(console.error);
