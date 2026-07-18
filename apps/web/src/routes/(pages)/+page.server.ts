import { env } from '@config/env'
import { logger } from '@logging'
import { randomUUID } from 'node:crypto'
import type { PageServerLoad } from './$types'

// The digest itself is fetched client-side from GET /api/digest/data (see
// +page.svelte) so a repeat visit can paint instantly from a localStorage
// cache before any network request resolves. This load only supplies cheap,
// DB-free config so SSR of the page shell stays fast on every request.
export const load: PageServerLoad = () => {
  const requestId = randomUUID()
  const log = logger.child({ route: '(pages)+page', requestId })

  const fuseThreshold = env.DIGEST_FUSE_THRESHOLD ?? 0.25
  const useMockData = env.USE_MOCK_DATA === 'true'

  log.debug({ fuseThreshold, useMockData }, 'home page shell load')

  return { fuseThreshold, useMockData }
}
