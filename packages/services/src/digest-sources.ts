import { logger } from '@2min.today/logging'
import { fetchRawItemsWithDiagnostics } from '@lib/pipeline/fetch'
import { randomUUID } from 'node:crypto'

export async function fetchDigestSourcesDiagnostics() {
  const log = logger.child({ runId: randomUUID(), route: 'digest-sources' })
  const { sources, dedupedCount } = await fetchRawItemsWithDiagnostics()
  const rawItemSum = sources.reduce((a, s) => a + s.itemCount, 0)
  log.info({ rawItemSum, dedupedItems: dedupedCount }, 'digest/sources fetch done')
  return {
    sources,
    rawItemSum,
    dedupedItems: dedupedCount,
  }
}
