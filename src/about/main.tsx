import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

/*
 * `../landing.css` is `../index.css` plus a few `@source not` lines. It carries
 * the three `@font-face` rules with it, so this page needs no font stylesheet
 * import of its own — three such imports used to sit here, were imported by
 * four entries at once, and were therefore hoisted into a second, render-
 * blocking `<link rel="stylesheet">` (the same P5-13 shape the landing page
 * already fixed) along with the three `.woff` rungs no browser can reach
 * (P5-6).
 */
import '../landing.css'
import { AboutPage } from './AboutPage'

// Checked, not asserted, for the reason written out in src/main.tsx (P2-5).
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from about.html')

const tree = (
  <StrictMode>
    <AboutPage />
  </StrictMode>
)

/*
 * Prerendered and hydrated like the landing page, and dev-server-rendered for
 * the same reason — the long note is in src/main.tsx. `scripts/prerender.mjs`
 * renders `renderAbout()` from src/entry-server.tsx into `dist/about.html`, and
 * that tree has to stay identical to this one, <StrictMode> and the motion
 * feature provider inside <AboutPage> included, or React 19 reports the
 * difference as a hydration error.
 */
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
