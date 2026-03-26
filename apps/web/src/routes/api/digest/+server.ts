import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/server';
import { pipeline } from '$lib/pipeline';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  if (url.searchParams.get('secret') !== env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .gte('published_at', todayStart.toISOString())
    .lt('published_at', todayEnd.toISOString())
    .limit(1);

  if (existing?.length) {
    return json({ status: 'already-run-today' });
  }

  try {
    const result = await pipeline.run(supabase);
    return json({ status: 'success', clustersCreated: result.length });
  } catch (e) {
    console.error('Pipeline failed:', e);
    return json({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
};
