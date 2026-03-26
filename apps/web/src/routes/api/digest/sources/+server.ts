import { json } from '@sveltejs/kit';
import { fetchRawItemsWithDiagnostics } from '$lib/pipeline/fetch';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  if (url.searchParams.get('secret') !== env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { items, sources, dedupedCount } = await fetchRawItemsWithDiagnostics();
    return json({
      status: 'ok',
      sources,
      rawItemSum: sources.reduce((a, s) => a + s.itemCount, 0),
      dedupedItems: dedupedCount,
    });
  } catch (e) {
    console.error('[digest/sources] fetch failed:', e);
    return json(
      {
        status: 'error',
        message: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
};
