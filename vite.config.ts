import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

/**
 * The deployed origin, for the absolute URLs in `index.html`'s social preview
 * (`og:url`, `og:image` — scrapers do not resolve a relative one).
 *
 * Vercel sets `VERCEL_PROJECT_PRODUCTION_URL` on every build to the project's
 * production hostname with no scheme (`hackbu-landing.vercel.app`, and the
 * custom domain once one is attached), so the origin is that plus `https://`.
 * Anywhere else — a local build, `vite dev` — the variable is absent and the
 * fallback below applies, which is the literal that used to be hardcoded in
 * `index.html`. So a local `dist/index.html` is unchanged from before, and a
 * domain move needs no edit to any HTML file.
 *
 * Why a plugin rather than Vite's built-in `%KEY%` interpolation: that hook
 * substitutes only keys present in `config.env`, i.e. `.env` variables carrying
 * the `envPrefix` (`VITE_`) plus the handful of `import.meta.env` built-ins. A
 * bare `process.env` name is not among them — an unknown `%KEY%` is returned
 * untouched — so `%VERCEL_PROJECT_PRODUCTION_URL%` in the HTML would ship to
 * production verbatim. Widening `envPrefix` to reach it would also expose every
 * other matching variable to client code, which is the thing the prefix exists
 * to prevent.
 *
 * `process.env` is read directly and one key by name; `loadEnv` is not used, so
 * no `.env.local` is parsed and nothing else can leak into the page.
 */
const SITE_ORIGIN_FALLBACK = 'https://hackbu-landing.vercel.app'

function siteOrigin(): Plugin {
  const host = process.env['VERCEL_PROJECT_PRODUCTION_URL']
  const origin = host ? `https://${host}` : SITE_ORIGIN_FALLBACK

  return {
    name: 'hackbu-site-origin',
    transformIndexHtml: {
      // Ahead of Vite's own env hook, so the placeholder is already gone by
      // the time anything else looks at the HTML.
      order: 'pre',
      handler: (html) => html.replaceAll('%SITE_ORIGIN%', origin),
    },
  }
}

/**
 * Two entry points, two pages:
 *
 *   index.html       the landing page          -> dist/index.html
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
  plugins: [react(), tailwindcss(), siteOrigin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
      },
    },
  },
})
