import { logger } from '@2min.today/logging'
import { breakingPipeline } from '@lib/pipeline/breaking'
import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

export async function runBreakingCron(supabase: SupabaseClient): Promise<number> {
  const log = logger.child({ runId: randomUUID(), route: 'breaking-handler' })
  const published = await breakingPipeline.run(supabase, { log })
  log.info({ published }, 'breaking handler success')
  return published
}
