import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

// `./hackathons.css` `@import`s `../index.css`, which carries the three
// `@font-face` rules — see the note in src/about/main.tsx for why there is no
// separate font stylesheet import here.
import './hackathons.css'
import HackathonsApp from './HackathonsApp.tsx'

// Checked, not asserted, for the reason written out in src/main.tsx (P2-5).
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from hackathons.html')

const tree = (
  <StrictMode>
    <HackathonsApp />
  </StrictMode>
)

// Prerendered and hydrated like the landing page; `renderHackathons()` in
// src/entry-server.tsx renders this exact tree at build time. See src/main.tsx.
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
