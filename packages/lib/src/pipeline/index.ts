import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';
import { createDigestChild } from '@2min.today/logging';
import { fetchRawItems } from './fetch';
import { embedItems } from './embed';
import { clusterItems } from './cluster';
import { summarizeClusters } from './summarize';
import { classifyClusters } from './classify';
import { upsertClusters } from './upsert';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassifiedCluster } from '@lib/types/digest';

export const pipeline = {
  async run(supabase: SupabaseClient, opts?: { log?: Logger }): Promise<ClassifiedCluster[]> {
    const log = opts?.log ?? createDigestChild({ runId: randomUUID() });
    const wall0 = Date.now();
    log.info('digest pipeline start');

    let t = Date.now();
    const rawItems = await fetchRawItems(log);
    log.info({ phase: 'fetch', durationMs: Date.now() - t, rawItemCount: rawItems.length }, 'digest phase');

    t = Date.now();
    const embedded = await embedItems(rawItems, log);
    log.info({ phase: 'embed', durationMs: Date.now() - t, embeddedCount: embedded.length }, 'digest phase');

    t = Date.now();
    const clusters = await clusterItems(embedded);
    log.info({ phase: 'cluster', durationMs: Date.now() - t, clusterCount: clusters.length }, 'digest phase');

    t = Date.now();
    const summarized = await summarizeClusters(clusters, log);
    log.info({ phase: 'summarize', durationMs: Date.now() - t, summarizedCount: summarized.length }, 'digest phase');

    t = Date.now();
    const classified = await classifyClusters(summarized, supabase, log);
    log.info({ phase: 'classify', durationMs: Date.now() - t, classifiedCount: classified.length }, 'digest phase');

    t = Date.now();
    const upserted = await upsertClusters(classified, supabase);
    log.info({ phase: 'upsert', durationMs: Date.now() - t, upsertedCount: upserted.length }, 'digest phase');

    log.info(
      { totalDurationMs: Date.now() - wall0, clustersCreated: upserted.length },
      'digest pipeline complete',
    );
    return upserted;
  },
};
