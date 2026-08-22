/**
 * Build-time prerender — the last step of `npm run build`.
 *
 * `vite build` writes two HTML files whose entire body is `<div id="root">`,
 * so nothing paints until ~100 KB gzip of JavaScript has downloaded, parsed and
 * executed, and the LCP element — the campus illustration — does not exist in
 * the HTML response at all (P5-1, and P5-8 with it: the twelve cloud cutouts
 * above the fold are undiscoverable for the same reason). This script renders
 * both pages to a string and writes that string into the root div, so the
 * markup ships with the document and the client hydrates it instead of building
 * it from nothing.
 *
 * ---------------------------------------------------------------------------
 * Why this shape
 * ---------------------------------------------------------------------------
 * The renders happen in a Vite dev server in `middlewareMode` — created, used
 * and closed inside this process, never listening on a port — because that is
 * the one way to run `src/entry-server.tsx` with the project's own transform
 * pipeline and no second build output. The alternative, `vite build --ssr`,
 * would emit a server bundle that has to be written somewhere, kept out of
 * `dist/` (Vercel deploys `dist/` verbatim), kept out of git, and cleaned up.
 * Nothing here writes a file except the two HTML files it rewrites.
 *
 * It rewrites the *built* HTML rather than the source template, so everything
 * `vite build` put in the head survives untouched: the hashed script and
 * stylesheet links, the `%SITE_ORIGIN%` substitution from vite.config.ts's
 * `siteOrigin` plugin, the LCP `<link rel="preload" as="image">`, and the three
 * font preloads its `fontPreload` plugin emits. The replacement is the root div
 * and nothing else — no tag is added to the head from here, so the prerendered
 * `<picture>` in the body does not duplicate or contradict the image preload
 * already declared above it.
 *
 * ---------------------------------------------------------------------------
 * What it does not do
 * ---------------------------------------------------------------------------
 * There is no data fetching, no router and no per-request state: the two pages
 * are the same for every visitor, which is what makes a build-time render
 * enough. Nothing from this file, from `src/entry-server.tsx`, or from
 * `react-dom/server` reaches the browser bundle — neither HTML entry imports
 * them, so they are not in the client module graph.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

/**
 * The placeholder both templates carry, and the only thing this script
 * replaces. An exact literal rather than a regex: if `index.html` ever stops
 * matching it the build fails loudly instead of silently shipping a blank page.
 */
const ROOT_DIV = '<div id="root"></div>'

/** One entry per HTML page: the built file, and the export that renders it. */
const PAGES = [
  { file: 'dist/index.html', render: 'renderIndex' },
  { file: 'dist/components.html', render: 'renderComponents' },
]

const server = await createServer({
  root: projectRoot,
  // `custom` so Vite does not try to serve or transform HTML itself, and
  // `middlewareMode` so no port is bound and no HMR socket is opened. The
  // watcher is off for the same reason: this process lives for a few hundred
  // milliseconds and has nothing to react to.
  appType: 'custom',
  logLevel: 'warn',
  server: { middlewareMode: true, hmr: false, watch: null },
})

try {
  const entry = await server.ssrLoadModule('/src/entry-server.tsx')

  for (const page of PAGES) {
    const path = join(projectRoot, page.file)
    const template = await readFile(path, 'utf8')

    if (!template.includes(ROOT_DIV)) {
      throw new Error(
        `${page.file}: expected exactly one ${ROOT_DIV} to render into.`,
      )
    }

    const markup = entry[page.render]()
    await writeFile(
      path,
      template.replace(ROOT_DIV, `<div id="root">${markup}</div>`),
    )

    console.log(`prerendered ${page.file} (${markup.length} chars)`)
  }
} finally {
  await server.close()
}
