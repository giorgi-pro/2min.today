import { digestLogger } from '@2min.today/logging'
import { cronUnauthorizedResponse, fetchDigestSourcesDiagnostics } from '@2min.today/services'
import { env } from '@config/env'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  const unauthorized = cronUnauthorizedResponse(url, env.CRON_SECRET, 'digest/sources unauthorized')
  if (unauthorized) return unauthorized

  try {
    const payload = await fetchDigestSourcesDiagnostics()
    return json({ status: 'ok', ...payload })
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : 'Unknown error'
    digestLogger.error({ err: errMessage, route: 'digest-sources' }, 'digest/sources fetch failed')
    return json({ status: 'error', message: errMessage }, { status: 500 })
  }
}
