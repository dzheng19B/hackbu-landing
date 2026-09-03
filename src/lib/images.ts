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
 * from the illustrated source; the four above it are cut from
 * `artwork/campus/Campus-upscaled-6688.webp`, a 4x Real-ESRGAN enlargement of
 * the illustration (see scripts/generate-images.mjs for why 4x). The hero
 * magnifies the illustration up to 3x, so the start frame is displayed far
 * wider than 1672px on every screen — the upscaled rungs are what keep it from
 * rendering soft next to the pixel-crisp cloud cutouts.
 */
const CAMPUS_WIDTHS = [640, 960, 1280, 1672, 2508, 3344, 5016, 6688] as const

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
 *   viewport aspect >= 1672/941 (16:9)  ->  width-constrained, content
 *                                           width = 100vw
 *   viewport aspect <  1672/941         ->  height-constrained, content width
 *                                           = 100vh x 1672/941 = 177.68vh
 *
 * (The artwork is 16:9, so laptops like 1440x900 and every portrait screen
 * sit in the vh branch; only screens wider than 16:9 take `vw`.)
 *
 * The image is fetched while the hero sits at its start frame, where the pan
 * has the content magnified by PAN_START_SCALE = 3 (see Hero.tsx) — so both
 * regimes are written here multiplied by 3: `300vw`, and
 * `300vh x 1672/941 = 533.05vh`. `sizes` has no way to see a transform, so the
 * factor is baked into the expression; it is exactly what lets a desktop reach
 * the upscaled rungs — quoting the unmagnified width would leave the browser
 * three rungs down, on the blur the ladder exists to fix.
 *
 * The two leading `1114px` entries cap small TOUCH screens out of the heavy
 * top rungs. On a phone, `object-cover` discards most of the drawn width (see
 * CAMPUS_OBJECT_POSITION in Hero.tsx), so a 1-2 MB rung's bytes would be
 * mostly cropped off screen; 1114px quotes a slot that lands DPR-2 phones on
 * the 2508 rung and DPR-3 phones on 3344 (1114 x 3 = 3342 <= 3344). The
 * `max-height` entry is the same cap for landscape phones, which a width test
 * alone misses. Both are gated on `(pointer: coarse)` because the dimension
 * tests alone also catch small *desktop* windows — a 455px-tall embedded
 * pane was measured taking the landscape-phone cap and rendering the start
 * frame from a low rung stretched 2x. A desktop window is DPR-1-or-2 and
 * resizable upward, so it always reads the honest magnified size below, and
 * desktops take the top of the ladder. (A browser that cannot evaluate
 * `pointer` treats the condition as false and falls through to the honest
 * entries — the failure mode is extra bytes, never extra blur.)
 *
 * Must match `imagesizes` on the preload link in index.html, or the preload
 * fetches a different rung than `<picture>` asks for and the image loads twice.
 */
export const CAMPUS_SIZES =
  '((pointer: coarse) and (max-width: 767px)) 1114px, ((pointer: coarse) and (max-height: 500px)) 1114px, (min-aspect-ratio: 1672/941) 300vw, 533.05vh'

/**
 * The campus illustration is content, not decoration — it is the reason the
 * page opens the way it does — so it gets a description of what is in it
 * rather than an empty alt.
 */
export const CAMPUS_ALT =
  'Illustration of the Binghamton University campus under snow, seen from ' +
  'above: red brick academic buildings and dormitories along snow-covered ' +
  'walkways, the Library Tower at the centre, wooded hills behind, and a ' +
  'bright blue sky with white clouds overhead.'

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
