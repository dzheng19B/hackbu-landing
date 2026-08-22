import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/*
 * Self-hosted fonts (latin subset only — no external Google Fonts request).
 *
 * Exactly the three faces the finished page uses, and no more. Fraunces 600 is
 * every display heading; Inter 400 is body copy and Inter 500 is the eyebrows
 * and button labels. (The logo is artwork now, not type.) Seven weights were
 * imported here at one point, of which four never matched a rule — the network
 * panel showed three woff2 files fetched on load either way, so the extra
 * imports cost only stylesheet bytes, but they also read as a claim that the
 * page uses weights it does not.
 */
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
