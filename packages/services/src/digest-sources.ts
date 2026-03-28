import { randomUUID } from 'node:crypto'
import { digestLogger } from '@2min.today/logging'
import { fetchRawItemsWithDiagnostics } from '@lib/pipeline/fetch'

export async function fetchDigestSourcesDiagnostics() {
  const log = digestLogger.child({ runId: randomUUID(), route: 'digest-sources' })
  const { sources, dedupedCount } = await fetchRawItemsWithDiagnostics()
  const rawItemSum = sources.reduce((a, s) => a + s.itemCount, 0)
  log.info({ rawItemSum, dedupedItems: dedupedCount }, 'digest/sources fetch done')
  return {
    sources,
    rawItemSum,
    dedupedItems: dedupedCount,
  }
}
