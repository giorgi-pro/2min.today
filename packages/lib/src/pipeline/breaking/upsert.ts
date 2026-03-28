import type { SupabaseClient } from "@supabase/supabase-js";
import type { BreakingCandidate } from "$lib/types/breaking";

export async function upsertLiveStory(
  supabase: SupabaseClient,
  candidate: BreakingCandidate,
  card: { headline: string; bullets: [string, string] },
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("clusters")
    .select("id")
    .eq("source_url", candidate.url)
    .limit(1);

  if (existing?.length) return false;

  const { error } = await supabase.from("clusters").insert({
    source_url: candidate.url,
    is_live: true,
    bucket: null,
    summary: {
      headline: card.headline,
      bullets: card.bullets,
      why_it_matters: "",
      credits: [{ source: candidate.source, url: candidate.url }],
    },
    published_at: candidate.published.toISOString(),
  });

  if (error) throw error;
  return true;
}
