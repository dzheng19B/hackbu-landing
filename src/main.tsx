import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

/*
 * `./landing.css` is `./index.css` plus one `@source not` line, so that the
 * component sheet's utilities are not emitted into the stylesheet this page
 * downloads. Everything else — tokens, type scale, brand marks — is unchanged
 * and still lives in `./index.css`, which both pages import.
 */
import './landing.css'
import App from './App.tsx'

// `index.html` ships `<div id="root">`, and `scripts/prerender.mjs` writes the
// server-rendered markup into it, so this cannot be null in a correct build.
// Checked rather than asserted (P2-5) so that an HTML edit that drops the div
// fails here, by name, instead of inside `hydrateRoot`.
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from index.html')

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

/*
 * `hydrateRoot` in production, because `#root` is not empty there.
 *
 * `scripts/prerender.mjs` renders this exact tree to a string at the end of
 * `npm run build` and writes it into `dist/index.html`, so the hero — its
 * <picture>, its campus <img>, the twelve cloud cutouts — is in the HTML
 * response and the preload scanner can act on the elements themselves rather
 * than only on the hint in the <head> (P5-1, and P5-8 with it). Hydrating
 * adopts that markup instead of replacing it; `createRoot().render()` would
 * throw the server's DOM away and reintroduce the blank first paint the
 * prerender exists to remove.
 *
 * The tree above must therefore match `src/entry-server.tsx`'s exactly,
 * <StrictMode> included, and nothing in it may read the browser during render
 * — see the note on `usePrefersReducedMotion()` in src/lib/motion.ts, which is
 * the one place that wanted to.
 *
 * The dev server is the exception, and it is not a compromise: `vite dev`
 * serves the *source* `index.html`, whose root div is empty, and hydrating an
 * empty root div is itself a mismatch — React 19 throws
 * "Hydration failed because the server rendered HTML didn't match the client"
 * and re-renders the whole tree, which would put a permanent error in the
 * console of every dev session. `import.meta.env.DEV` is a compile-time
 * constant, so the production bundle keeps only the `hydrateRoot` branch and
 * the check costs nothing shipped.
 */
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
