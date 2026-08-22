import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

/*
 * `../index.css` carries the three `@font-face` rules as well as the tokens, so
 * the sheet is drawn in exactly the faces the landing page uses (Fraunces 600
 * for display, Inter 400/500 for body and labels) with no separate import.
 */
import '../index.css'
import './sheet.css'
import { ComponentSheet } from './ComponentSheet'

// Checked, not asserted, for the reason written out in src/main.tsx (P2-5).
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from components.html')

const tree = (
  <StrictMode>
    <ComponentSheet />
  </StrictMode>
)

/*
 * Prerendered and hydrated, like the landing page, and dev-server-rendered for
 * the same reason — see the longer note in src/main.tsx. The sheet gains
 * nothing from a fast first paint (it is an internal, noindex page), but it
 * renders the same components, so building it the same way is what keeps the
 * SSR path honest: if a component ever reaches for the browser during render,
 * both pages fail rather than only one.
 */
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
