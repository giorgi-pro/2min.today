import { fetchRawItems } from './fetch';
import { embedItems } from './embed';
import { clusterItems } from './cluster';
import { summarizeClusters } from './summarize';
import { classifyClusters } from './classify';
import { upsertClusters } from './upsert';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClassifiedCluster } from '$lib/types/digest';

export const pipeline = {
  async run(supabase: SupabaseClient): Promise<ClassifiedCluster[]> {
    const rawItems = await fetchRawItems();
    const embedded = await embedItems(rawItems);
    const clusters = await clusterItems(embedded);
    const summarized = await summarizeClusters(clusters);
    const classified = await classifyClusters(summarized, supabase);
    return upsertClusters(classified, supabase);
  },
};
