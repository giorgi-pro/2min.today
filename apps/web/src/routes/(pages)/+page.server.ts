import { loadHomePageDigest } from '@2min.today/services/home-page'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => loadHomePageDigest()
