import path from 'node:path'
import { fileURLToPath } from 'node:url'
import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      '@ui': path.resolve(dirname, '../../packages/ui/src'),
      '@lib': path.resolve(dirname, '../../packages/lib/src'),
      '@config': path.resolve(dirname, '../../packages/config/env'),
      '@2min.today/logging': path.resolve(dirname, '../../packages/logging/logger.ts'),
      '@2min.today/config/env': path.resolve(dirname, '../../packages/config/env/index.ts'),
    },
  },
}

export default config
