import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/server';
import { breakingPipeline } from '$lib/pipeline/breaking';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  if (url.searchParams.get('secret') !== env.BREAKING_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const published = await breakingPipeline.run(supabase);
    return json({ status: 'ok', published });
  } catch (e) {
    console.error('Breaking pipeline failed:', e);
    return json({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
};
