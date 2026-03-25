import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchRawItems } from '../fetch';
import { scoreItems } from './score';
import { generateLiveCard } from './generate';
import { upsertLiveStory } from './upsert';

export const breakingPipeline = {
  async run(supabase: SupabaseClient): Promise<number> {
    const rawItems = await fetchRawItems();
    const candidates = scoreItems(rawItems);

    let published = 0;
    for (const candidate of candidates) {
      try {
        const card = await generateLiveCard(candidate);
        const inserted = await upsertLiveStory(supabase, candidate, card);
        if (inserted) published++;
      } catch (e) {
        console.error(`Breaking pipeline: skipping "${candidate.title}":`, e);
      }
    }

    return published;
  },
};
