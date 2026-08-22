import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

// `./schedule.css` `@import`s `../index.css`, which carries the three
// `@font-face` rules — see the note in src/about/main.tsx for why there is no
// separate font stylesheet import here.
import './schedule.css'
import ScheduleApp from './ScheduleApp.tsx'

// Checked, not asserted, for the reason written out in src/main.tsx (P2-5).
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from schedule.html')

const tree = (
  <StrictMode>
    <ScheduleApp />
  </StrictMode>
)

// Prerendered and hydrated like the landing page; `renderSchedule()` in
// src/entry-server.tsx renders this exact tree at build time. See src/main.tsx.
if (import.meta.env.DEV) {
  createRoot(mount).render(tree)
} else {
  hydrateRoot(mount, tree)
}
