import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { BUCKET_ANCHORS } from '../apps/web/src/lib/config/buckets';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function seedAnchors() {
  for (const [bucket, text] of Object.entries(BUCKET_ANCHORS)) {
    const result = await model.embedContent(text);
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
