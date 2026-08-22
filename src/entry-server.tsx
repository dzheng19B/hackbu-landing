import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { ComponentSheet } from './sheet/ComponentSheet'

/**
 * The build-time render of both pages.
 *
 * `scripts/prerender.mjs` loads this module through Vite's SSR pipeline after
 * `vite build` has finished, calls one function per page, and drops the string
 * into that page's `<div id="root">`. Nothing here ships to the browser: this
 * file is not reachable from either HTML entry, so it is not in the client
 * module graph and no chunk carries it.
 *
 * Each tree is written out verbatim rather than parameterised, and each one has
 * to stay identical to its client counterpart — `src/main.tsx` and
 * `src/sheet/main.tsx` — <StrictMode> wrapper included. That pairing is the
 * whole contract: `hydrateRoot` adopts the markup below only if the first
 * client render produces the same thing, and React 19 reports any difference as
 * an error rather than quietly patching it.
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

/** `components.html` — the internal component sheet. */
export function renderComponents(): string {
  return renderToString(
    <StrictMode>
      <ComponentSheet />
    </StrictMode>,
  )
}
