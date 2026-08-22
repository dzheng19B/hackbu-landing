/**
 * Image delivery constants.
 *
 * `scripts/generate-images.mjs` writes AVIF + WebP derivatives beside the PNGs
 * in `public/artwork/`; this module is the single place the app describes them.
 * The PNGs stay as the last-resort `<img src>` inside each `<picture>`, so a
 * browser that understands neither modern format still gets the artwork.
 *
 * Three copies of the campus srcset exist and they must agree:
 *   - `CAMPUS_WIDTHS` here
 *   - `CAMPUS_WIDTHS` in scripts/generate-images.mjs
 *   - the `imagesrcset` on the preload link in index.html
 * `npm run images` prints the strings it generated for exactly this reason.
 */

export const CAMPUS_PNG = '/artwork/campus/Campus.png'
export const CAMPUS_WIDTH = 1672
export const CAMPUS_HEIGHT = 941

/**
 * The derivative ladder. It stops at the intrinsic 1672px because the hero
 * magnifies the illustration rather than shrinking it — there is no real
 * detail above the source width to deliver.
 */
const CAMPUS_WIDTHS = [640, 960, 1280, 1672] as const

function campusSrcSet(extension: 'avif' | 'webp'): string {
  return CAMPUS_WIDTHS.map(
    (width) => `/artwork/campus/Campus-${width}.${extension} ${width}w`,
  ).join(', ')
}

export const CAMPUS_SRCSET = {
  avif: campusSrcSet('avif'),
  webp: campusSrcSet('webp'),
} as const

/**
 * How wide the illustration is actually *drawn*, which is not the width of its
 * box. The `<img>` is `object-cover` into a viewport-sized stage, so at scale 1
 * the drawn content is:
 *
 *   viewport aspect >= 1672/941  ->  width-constrained, content width = 100vw
 *   viewport aspect <  1672/941  ->  height-constrained, content width
 *                                    = 100vh x 1672/941 = 177.68vh
 *
 * The second case covers every phone and most desktops, and `100vw` would
 * understate it by a third at 1440x900 — enough to drop the browser a rung down
 * the ladder on a 2x screen. The hero then magnifies this by up to 3x, which
 * `sizes` has no way to express; it does not matter, because the ladder is
 * capped at the source width and the top rung is already selected everywhere
 * this expression matters.
 *
 * Must match `imagesizes` on the preload link in index.html, or the preload
 * fetches a different rung than `<picture>` asks for and the image loads twice.
 */
export const CAMPUS_SIZES = '(min-aspect-ratio: 1672/941) 100vw, 177.68vh'

/**
 * The campus illustration is content, not decoration — it is the reason the
 * page opens the way it does — so it gets a description of what is in it
 * rather than an empty alt.
 */
export const CAMPUS_ALT =
  'Illustration of the Binghamton University campus under snow: a wooded ' +
  'ridgeline above red brick academic buildings and dormitories, with the ' +
  'Library Tower standing at the centre and a pale winter sky overhead.'

/* -------------------------------------------------------------------------- */
/* Brand marks                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The ink boxes of the two logo marks — the trimmed bounds of the artwork in
 * `brand-source/`, which is what the mask derivatives in `public/brand/` are
 * cropped to. Only the ratio is used: `<Wordmark>` gives each mark an
 * `aspect-ratio` built from these numbers so a height in `em` fixes the width.
 *
 * **Keep in sync with `npm run images`**, which prints both boxes at the end of
 * a run for exactly this comparison. The mask URLs themselves live in
 * `src/index.css`, with the rest of the mark's paint.
 */
export const BEARCAT_MARK = { width: 1741, height: 1828 } as const
export const WORDMARK_MARK = { width: 7690, height: 1080 } as const

/** Cloud cutouts are pure decoration; only their format sources vary. */
export function cloudSources(file: string) {
  const base = file.replace(/\.png$/, '')
  return {
    png: `/artwork/clouds/${base}.png`,
    webp: `/artwork/clouds/${base}.webp`,
    avif: `/artwork/clouds/${base}.avif`,
  }
}
