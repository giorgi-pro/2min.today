import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import 'dotenv/config';

function buildEnv() {
  return createEnv({
    server: {
      NODE_ENV: z.enum(["development", "test", "production"]),
      LOG_PRETTY: z.string().optional(),
      LOG_LEVEL: z.string().optional(),
      FLASH_MODEL: z.string(),
      EMBEDDING_MODEL: z.string(),
      EMBEDDING_DIMENSION: z.coerce.number().int().positive(),
      FLASH_GENERATION_MIN_INTERVAL_MS: z.coerce.number().int().positive().optional(),
      FLASH_GENERATION_TEMPERATURE: z.coerce.number().optional(),
      FLASH_THINKING_BUDGET: z.coerce.number().optional(),
      FLASH_THINKING_LEVEL: z.enum(["MINIMAL", "LOW", "MEDIUM", "HIGH"]).optional(),
      GEMINI_API_KEY: z.string(),
      SUPABASE_SERVICE_ROLE_KEY: z.string(),
      SUPABASE_URL: z.string().url(),
      X_BEARER_TOKEN: z.string(),
      CRON_SECRET: z.string(),
      BREAKING_SECRET: z.string(),
      USE_MOCK_DATA: z.enum(["true", "false"]).optional(),
      DIGEST_FUSE_THRESHOLD: z.coerce.number().optional(),
      DIGEST_SUMMARIZE_MAX_CLUSTERS: z.coerce.number().int().positive().optional(),
      CLASSIFY_SIMILARITY_THRESHOLD: z.coerce.number().optional(),
      CLUSTER_SIMILARITY_THRESHOLD: z.coerce.number().optional(),
    },
    clientPrefix: "PUBLIC_",
    client: {
      PUBLIC_SUPABASE_ANON_KEY: z.string(),
      PUBLIC_SUPABASE_URL: z.string().url(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
}

type Env = ReturnType<typeof buildEnv>;

let _env: Env | undefined;

export const env: Env = new Proxy({} as Env, {
  get(_, key: string) {
    if (!_env) _env = buildEnv();
    return _env[key as keyof Env];
  },
});
