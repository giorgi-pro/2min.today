import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/private'
import { EMBEDDING_MODEL, FLASH_MODEL } from '$lib/server/digest/models'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ request }) => {
  const cronSecret = env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      throw error(401, 'Unauthorized')
    }
  }

  const geminiKey = env.GEMINI_API_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!geminiKey || !supabaseUrl || !supabaseKey) {
    return json(
      {
        ok: false,
        step: 'config',
        detail:
          'Set GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY (see .env.example)',
      },
      { status: 503 },
    )
  }

  const genAI = new GoogleGenerativeAI(geminiKey)
  const pipeline = {
    flash: genAI.getGenerativeModel({ model: FLASH_MODEL }),
    embedding: genAI.getGenerativeModel({ model: EMBEDDING_MODEL }),
    supabase: createClient(supabaseUrl, supabaseKey),
  }

  return json({
    ok: true,
    step: 'scaffold',
    models: { flash: FLASH_MODEL, embedding: EMBEDDING_MODEL },
    clients: Object.keys(pipeline),
    message:
      'Pipeline entrypoint ready: RSS/X fetch → embed → cluster/classify → synthesize → Supabase upsert',
  })
}
