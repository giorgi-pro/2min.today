import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@2min.today/config/env";

let _client: SupabaseClient | null = null;

export function getSupabaseServiceRoleClient(): SupabaseClient {
  if (!_client) {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (url == null || url === "" || key == null || key === "") {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
      );
    }
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}
