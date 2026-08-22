import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { AboutPage } from './about/AboutPage'
import ScheduleApp from './schedule/ScheduleApp.tsx'
import { SponsorsPage } from './sponsors/SponsorsPage'
import HackathonsApp from './hackathons/HackathonsApp.tsx'
import { ComponentSheet } from './sheet/ComponentSheet'

/**
 * The build-time render of all six pages.
 *
 * `scripts/prerender.mjs` loads this module through Vite's SSR pipeline after
 * `vite build` has finished, calls one function per page, and drops the string
 * into that page's `<div id="root">`. Nothing here ships to the browser: this
 * file is not reachable from any HTML entry, so it is not in the client
 * module graph and no chunk carries it.
 *
 * Each tree is written out verbatim rather than parameterised, and each one has
 * to stay identical to its client counterpart — `src/main.tsx`,
 * `src/about/main.tsx`, `src/schedule/main.tsx`, `src/sponsors/main.tsx`,
 * `src/hackathons/main.tsx` and `src/sheet/main.tsx` — <StrictMode> wrapper
 * included. That pairing is the whole contract: `hydrateRoot` adopts the markup
 * below only if the first client render produces the same thing, and React 19
 * reports any difference as an error rather than quietly patching it.
 *
 * The four page components below each carry their own motion feature provider
 * *inside* the component, the way `App` and `ComponentSheet` do, so there is no
 * wrapper to remember here and no way for the two sides to disagree about one.
 *
 * `renderToString` and not `renderToStaticMarkup`, because these pages *are*
 * hydrated, and `renderToStaticMarkup` omits the bookkeeping hydration reads.
 */

/** `index.html` — the landing page. */
export function renderIndex(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

/** `about.html` — the About us page. */
export function renderAbout(): string {
  return renderToString(
    <StrictMode>
      <AboutPage />
    </StrictMode>,
  )
}

/** `schedule.html` — the weekly workshop schedule. */
export function renderSchedule(): string {
  return renderToString(
    <StrictMode>
      <ScheduleApp />
    </StrictMode>,
  )
}

/** `sponsors.html` — the sponsorship page. */
export function renderSponsors(): string {
  return renderToString(
    <StrictMode>
      <SponsorsPage />
    </StrictMode>,
  )
}

/** `hackathons.html` — the hackathon and registration page. */
export function renderHackathons(): string {
  return renderToString(
    <StrictMode>
      <HackathonsApp />
    </StrictMode>,
  )
}

/** `components.html` — the internal component sheet. */
export function renderComponents(): string {
  return renderToString(
    <StrictMode>
      <ComponentSheet />
    </StrictMode>,
  )
}
