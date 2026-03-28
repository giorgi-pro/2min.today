import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "$env/dynamic/public";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      env.PUBLIC_SUPABASE_URL ?? "",
      env.PUBLIC_SUPABASE_ANON_KEY ?? "",
    );
  }
  return _client;
}
