import { digestLogger } from '@2min.today/logging'

export function cronUnauthorizedResponse(
  url: URL,
  secret: string,
  debugMessage: string,
): Response | null {
  if (url.searchParams.get('secret') !== secret) {
    digestLogger.debug(debugMessage)
    return new Response('Unauthorized', { status: 401 })
  }
  return null
}
