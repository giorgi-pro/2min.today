import type { EmbedContentRequest } from '@google/generative-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { BUCKET_ANCHORS } from '../apps/web/src/lib/config/buckets';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from '../apps/web/src/lib/server/digest/models';
import 'dotenv/config';

type EmbedRequest = EmbedContentRequest & { outputDimensionality?: number };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seedAnchors() {
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
