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
 * The derivative ladder. The rungs at and below the intrinsic 1672px are cut
 * from the painted source; 2508 and 3344 are cut from
 * `artwork/campus/Campus-upscaled-3344.png`, a 2x Real-ESRGAN enlargement of
 * the painting (see scripts/generate-images.mjs). The hero magnifies the
 * illustration up to 3x, so the start frame is displayed far wider than 1672px
 * on every screen — the upscaled rungs are what keep it from rendering soft.
 */
const CAMPUS_WIDTHS = [640, 960, 1280, 1672, 2508, 3344] as const

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
 * The image is fetched while the hero sits at its start frame, where the pan
 * has the content magnified by PAN_START_SCALE = 3 (see Hero.tsx) — so both
 * regimes are written here multiplied by 3: `300vw`, and
 * `300vh x 1672/941 = 533.05vh`. `sizes` has no way to see a transform, so the
 * factor is baked into the expression. When the ladder was capped at the
 * source's 1672px this did not matter — the top rung was selected everywhere
 * either way — but with the 2508/3344 upscaled rungs it is exactly what lets a
 * low-DPR desktop reach them: at 1440x900 the start frame draws the content
 * 533.05vh = ~4797 CSS px wide, and quoting the unmagnified ~1599px would
 * leave the browser on the 1672 rung the blur came from.
 *
 * Must match `imagesizes` on the preload link in index.html, or the preload
 * fetches a different rung than `<picture>` asks for and the image loads twice.
 */
export const CAMPUS_SIZES = '(min-aspect-ratio: 1672/941) 300vw, 533.05vh'

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

/* -------------------------------------------------------------------------- */
/* About us photos                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Event photos on the About us page. Sources live in `public/artwork/about/`;
 * AVIF + WebP sit beside each JPEG and are rebuilt by `npm run images`.
 */
function aboutPhoto(file: string, width: number, height: number, alt: string) {
  const base = `/artwork/about/${file}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
  } as const
}

export const ABOUT_PHOTOS = {
  collaborate: aboutPhoto(
    'collaborate',
    1024,
    683,
    'Three students huddled around a laptop at a HackBU event, smiling as they work through a problem together.',
  ),
  table: aboutPhoto(
    'table',
    1024,
    768,
    'Students collaborating at workshop tables with laptops in a bright room with floor-to-ceiling windows at a HackBU event.',
  ),
  hackathon: aboutPhoto(
    'hackathon',
    1024,
    683,
    'Students coding at a HackBU hackathon, with a HackBU tote bag on a chair and Binghamton gear in the room.',
  ),
} as const

/* -------------------------------------------------------------------------- */
/* Sponsors photo                                                             */
/* -------------------------------------------------------------------------- */

function sponsorsPhoto(file: string, width: number, height: number, alt: string) {
  const base = `/artwork/sponsors/${file}`
  return {
    jpg: `${base}.jpg`,
    webp: `${base}.webp`,
    avif: `${base}.avif`,
    width,
    height,
    alt,
  } as const
}

export const SPONSORS_PHOTO = sponsorsPhoto(
  'workshop',
  1024,
  768,
  'Students around a workshop table with laptops, talking with a mentor, winter campus visible through the windows.',
)
