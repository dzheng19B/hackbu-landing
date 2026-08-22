import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * Two entry points, two pages:
 *
 *   index.html       the landing page          -> dist/index.html
 *   components.html  the component sheet       -> dist/components.html
 *   schedule.html    the schedule page           -> dist/schedule.html
 *
 * They share the component tree, so Rollup hoists what both import into a
 * shared chunk and each page's own entry chunk holds only its own code. The
 * sheet's code therefore never reaches the landing page's bundle — verify by
 * checking that nothing under `src/sheet/` appears in the landing page's
 * module graph after a build.
 */
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
        schedule: fileURLToPath(new URL('./schedule.html', import.meta.url)),
      },
    },
  },
})
