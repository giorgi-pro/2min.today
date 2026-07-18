import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    prerender: { handleMissingId: 'ignore', entries: [] },
    alias: {
      '@types': path.resolve(dirname, '../../packages/types'),
      '@ui': path.resolve(dirname, '../../packages/ui/src'),
      '@lib': path.resolve(dirname, '../../packages/lib/src'),
      '@config': path.resolve(dirname, '../../packages/config'),
      '@utils': path.resolve(dirname, '../../packages/utils'),
      '@logging': path.resolve(dirname, '../../packages/logging'),
      '@services': path.resolve(dirname, '../../packages/services'),
      '@data': path.resolve(dirname, '../../packages/data'),

      '@2min.today/types': path.resolve(dirname, '../../packages/types'),
      '@2min.today/utils': path.resolve(dirname, '../../packages/utils'),
      '@2min.today/config': path.resolve(dirname, '../../packages/config'),
      '@2min.today/logging': path.resolve(dirname, '../../packages/logging'),
      '@2min.today/services': path.resolve(dirname, '../../packages/services'),
      '@2min.today/data': path.resolve(dirname, '../../packages/data'),
    },
  },
}

export default config
