import { sveltekit } from '@sveltejs/kit/vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  plugins: [
    devtoolsJson({ projectRoot: monorepoRoot }),
    sveltekit(),
  ],
})
