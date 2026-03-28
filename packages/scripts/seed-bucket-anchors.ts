import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import type { EmbedRequest } from "@2min.today/types";
import { BUCKET_ANCHORS } from "../apps/web/src/lib/config/buckets";
import { env } from "@2min.today/config/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seedAnchors() {
  const model = genAI.getGenerativeModel({ model: env.EMBEDDING_MODEL });
  for (const [bucket, text] of Object.entries(BUCKET_ANCHORS)) {
    const req: EmbedRequest = {
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: env.EMBEDDING_DIMENSION,
    };
    const result = await model.embedContent(req);
    const embedding = result.embedding.values;

    const { error } = await supabase
      .from("bucket_anchors")
      .upsert({ bucket, embedding }, { onConflict: "bucket" });

    if (error) {
      console.error(`Failed to seed ${bucket}:`, error.message);
      continue;
    }

    console.log(`Seeded ${bucket}`);
  }
  console.log("All bucket anchors seeded.");
}

seedAnchors().catch(console.error);
