import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * Serve `/about` and `/components` without the `.html` suffix in `vite dev`,
 * matching the Vercel rewrites in vercel.json.
 */
function cleanHtmlUrls(): Plugin {
  const rewrites: Record<string, string> = {
    '/about': '/about.html',
    '/about/': '/about.html',
    '/components': '/components.html',
    '/components/': '/components.html',
  }

  return {
    name: 'clean-html-urls',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split('?')[0]
        if (path && rewrites[path]) {
          req.url = (req.url ?? '').replace(path, rewrites[path])
        }
        next()
      })
    },
  }
}

/**
 * Three entry points, three pages:
 *
 *   index.html       the landing page          -> dist/index.html
 *   about.html       the About us page         -> dist/about.html
 *   components.html  the component sheet       -> dist/components.html
 *
 * They share the component tree, so Rollup hoists what both import into a
 * shared chunk and each page's own entry chunk holds only its own code. The
 * sheet's code therefore never reaches the landing page's bundle — verify by
 * checking that nothing under `src/sheet/` appears in the landing page's
 * module graph after a build.
 */
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cleanHtmlUrls()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
      },
    },
  },
})
