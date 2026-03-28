import { digestLogger } from '@2min.today/logging'
import { cronUnauthorizedResponse, runBreakingCron } from '@2min.today/services'
import { env } from '@config/env'
import { getSupabaseServiceRoleClient } from '@data/supabase/server'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const unauthorized = cronUnauthorizedResponse(url, env.BREAKING_SECRET, 'breaking unauthorized')
  if (unauthorized) return unauthorized

  try {
    const supabase = getSupabaseServiceRoleClient()
    const published = await runBreakingCron(supabase)
    return json({ status: 'ok', published })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    digestLogger.error({ err: errMessage, route: 'breaking-handler' }, 'breaking pipeline failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
