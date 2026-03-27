import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';
import type { SupabaseClient } from '@supabase/supabase-js';
import { digestLogger } from '@2min.today/lib/server/digest/logger';
import { fetchRawItems } from '../fetch';
import { scoreItems } from './score';
import { generateLiveCard } from './generate';
import { upsertLiveStory } from './upsert';

export const breakingPipeline = {
  async run(supabase: SupabaseClient, opts?: { log?: Logger }): Promise<number> {
    const log =
      opts?.log ?? digestLogger.child({ runId: randomUUID(), route: 'breaking', pipeline: 'breaking' });

    const rawItems = await fetchRawItems(log);
    const candidates = scoreItems(rawItems);

    let published = 0;
    for (const candidate of candidates) {
      try {
        const card = await generateLiveCard(candidate);
        const inserted = await upsertLiveStory(supabase, candidate, card);
        if (inserted) published++;
      } catch (e) {
        log.error(
          { err: e instanceof Error ? e.message : String(e), title: candidate.title },
          'breaking pipeline: skip candidate',
        );
      }
    }

    log.info({ published, candidateCount: candidates.length }, 'breaking pipeline complete');
    return published;
  },
};
