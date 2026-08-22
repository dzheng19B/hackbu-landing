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
 * The three self-hosted faces, by the base name `@fontsource` gives them, in
 * the order they are preloaded. `src/index.css` declares one `@font-face` per
 * entry here and Vite emits each as a content-hashed asset — so the hashes are
 * read back out of the bundle below rather than written down anywhere.
 *
 * All three, not just the two above the fold. Fraunces is display-only and the
 * hero carries no type, so the earlier reading was that preloading it would
 * compete with the LCP image for bandwidth; against that, `<IntroSection>`'s
 * <h1> is the first thing under the hero and is set in it, `font-display: swap`
 * means a late face is a reflow rather than a delay, and 18 KB is small next to
 * the 495 KB of imagery the same connection is already carrying. Preloading the
 * set the page actually uses is the simpler contract, and it is the whole set:
 * Fraunces 600, Inter 400, Inter 500 and nothing else.
 */
const PRELOADED_FONTS = [
  'fraunces-latin-600-normal',
  'inter-latin-400-normal',
  'inter-latin-500-normal',
]

/**
 * `<link rel="preload" as="font">` for those three, on the landing page.
 *
 * Without it the faces cannot be requested until the stylesheet has arrived
 * *and* style resolution has found an element using each family — which is late,
 * and above-the-fold text on this page is Inter (the header's nav links are
 * Inter 500, body copy is Inter 400). The preload starts them alongside the
 * stylesheet instead. See P5-5.
 *
 * The filenames are content-hashed, so they cannot be written by hand. `order:
 * 'post'` runs this after Vite has emitted the bundle, which is what makes
 * `ctx.bundle` available to look them up in; in dev `ctx.bundle` is undefined
 * and the hook is a no-op, which is correct — the dev server serves the faces
 * unhashed straight out of `node_modules` and there is nothing to preload.
 *
 * `crossorigin` is not optional here even though the fonts are same-origin:
 * fonts are always fetched in CORS mode, and a preload whose mode does not
 * match the later fetch is a second download rather than a warm cache.
 *
 * The tags are written in before the stylesheet link rather than appended to
 * the end of the head, so the three font requests are queued ahead of the
 * request that would otherwise have to complete before they could start.
 *
 * `index.html` only. The component sheet is internal, is never a cold first
 * visit that matters, and is `noindex` — one page's worth of head is enough.
 */
function fontPreload(): Plugin {
  let base = '/'

  return {
    name: 'hackbu-font-preload',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle || !ctx.path.endsWith('/index.html')) return

        const emitted = Object.keys(ctx.bundle).filter((name) =>
          name.endsWith('.woff2'),
        )

        const links = PRELOADED_FONTS.map((face) => {
          const file = emitted.find((name) => name.includes(`${face}-`))
          if (!file) {
            throw new Error(
              `fontPreload: no emitted .woff2 asset for "${face}". Did src/index.css stop declaring it?`,
            )
          }
          return `    <link rel="preload" as="font" type="font/woff2" crossorigin href="${base}${file}" />`
        }).join('\n')

        const stylesheet = html.indexOf('<link rel="stylesheet"')
        const at = stylesheet === -1 ? html.indexOf('</head>') : stylesheet
        return `${html.slice(0, at)}${links.trim()}\n    ${html.slice(at)}`
      },
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

/**
 * Names the two chunks both pages share, instead of letting Rollup name them
 * after whichever module happens to be their facade (P1-1).
 *
 * Left alone, Rollup hoisted React, `motion` *and* every shared component into
 * one 283 KB chunk and called it `SiteFooter-*.js`, after a 72-line footer.
 * The behaviour was right and the name was a trap for anyone reading a build
 * log or a performance trace. Two deliberate names instead:
 *
 *   vendor  everything from node_modules — react, react-dom, scheduler,
 *           react/jsx-runtime, motion and its motion-dom / motion-utils
 *           internals. Third-party code, versioned by package.json, changing
 *           only when a dependency does.
 *   shared  `src/components/**` and `src/lib/**` — the component tree and the
 *           three lib modules. This is exactly the set both entries import:
 *           the sheet renders the real components, sections included
 *           (`src/sheet/parts/ComposedPart.tsx`), so nothing landing-only is
 *           being pushed into the sheet's download by naming it this way.
 *
 * Nothing under `src/sheet/` matches either rule, so the sheet's own code stays
 * in the `components` entry chunk and out of the landing page, exactly as
 * before. CSS is left to Vite: `@fontsource` ships stylesheets, not modules,
 * and assigning them a JS chunk would take Vite's stylesheet handling out of
 * the loop for no gain.
 */
function manualChunks(id: string): string | undefined {
  const path = id.replaceAll('\\', '/')
  if (/\.(css|scss|sass|less)($|\?)/.test(path)) return undefined
  // Vite's `modulepreload-polyfill` is a virtual module, so it has no
  // `node_modules` path to match on, and both entries pull it in — without this
  // it becomes a shared chunk of its own. Rolldown's own runtime shim is the
  // one thing here that cannot be placed: the bundler emits
  // `rolldown-runtime-*.js` itself and never offers it to this function. It is
  // 589 B, it is named after what it is, and it is left alone.
  if (path.includes('modulepreload-polyfill')) return 'vendor'
  if (path.includes('/node_modules/')) return 'vendor'
  if (/\/src\/(components|lib)\//.test(path)) return 'shared'
  return undefined
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteOrigin(), fontPreload()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        components: fileURLToPath(new URL('./components.html', import.meta.url)),
      },
      output: { manualChunks },
    },
  },
})
