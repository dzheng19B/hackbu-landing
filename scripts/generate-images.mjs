/**
 * Build-time image derivative generator — `npm run images`.
 *
 * Reads the deployable PNGs under `public/artwork/` and writes AVIF + WebP
 * derivatives beside them. The originals in `artwork/` are never touched, and
 * the PNGs in `public/artwork/` stay in place as the final <picture> fallback.
 *
 * This runs by hand, not on every build: the outputs are committed, so a
 * deploy needs nothing but `vite build`. `sharp` is therefore a devDependency
 * and never reaches the browser bundle.
 *
 * ---------------------------------------------------------------------------
 * Widths
 * ---------------------------------------------------------------------------
 * Campus.png is 1672 x 941. **1672 is the ceiling** — the hero magnifies the
 * illustration up to 3x, so every viewport above a phone already wants more
 * pixels than the source has, and emitting a width above the intrinsic one
 * would spend bytes on interpolation the browser can do for free. The ladder
 * below therefore stops at the source width and steps down for small and
 * low-DPR viewports.
 *
 * The clouds are 224-430px cutouts rendered at up to 1.15x, so they are also
 * already at or past 1:1 on every screen. One derivative each, at the
 * intrinsic width; a <picture> with no srcset, switching on format only.
 *
 * ---------------------------------------------------------------------------
 * Quality
 * ---------------------------------------------------------------------------
 * Measured on the full-width campus tier (PSNR against the source PNG):
 *
 *     AVIF q60 237 KB 34.25 dB   q65 267 KB 35.15 dB   q70 324 KB 36.63 dB
 *     WebP q80 318 KB 33.49 dB   q85 385 KB 34.59 dB   q90 499 KB 36.23 dB
 *
 * AVIF q68 / WebP q82 sit just below the knee of both curves. The campus image
 * is the LCP element and is displayed upscaled, where compression artifacts are
 * magnified along with everything else, so this leans toward quality — it is
 * still ~9x smaller than the 2.81 MB PNG and leaves most of the 1.5 MB
 * first-load image budget unspent.
 */

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARTWORK = join(ROOT, 'public', 'artwork')

/**
 * Campus srcset ladder. **Keep in sync with `CAMPUS_WIDTHS` in
 * `src/lib/images.ts` and with the preload `imagesrcset` in `index.html`.**
 * The script prints both strings at the end of a run so a drift is visible.
 */
const CAMPUS_WIDTHS = [640, 960, 1280, 1672]

const AVIF = { quality: 68, effort: 6 }
const CAMPUS_WEBP = { quality: 82, effort: 6 }
/** The cutouts are mostly soft alpha edges; a high alphaQuality keeps them clean. */
const CLOUD_AVIF = { quality: 70, effort: 6 }
const CLOUD_WEBP = { quality: 82, effort: 6, alphaQuality: 90 }

const written = []

async function emit(pipeline, outPath) {
  const buffer = await pipeline.toBuffer()
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, buffer)
  written.push({ path: outPath, bytes: buffer.length })
  return buffer.length
}

async function generateCampus() {
  const src = join(ARTWORK, 'campus', 'Campus.png')
  const { width: intrinsic } = await sharp(src).metadata()

  for (const width of CAMPUS_WIDTHS) {
    if (width > intrinsic) {
      throw new Error(
        `Campus width ${width} exceeds the intrinsic ${intrinsic}px source.`,
      )
    }
    const resized = () => sharp(src).resize({ width, withoutEnlargement: true })
    await emit(resized().avif(AVIF), join(ARTWORK, 'campus', `Campus-${width}.avif`))
    await emit(
      resized().webp(CAMPUS_WEBP),
      join(ARTWORK, 'campus', `Campus-${width}.webp`),
    )
  }
}

async function generateClouds() {
  const dir = join(ARTWORK, 'clouds')
  const files = (await readdir(dir)).filter((name) => name.endsWith('.png'))
  for (const file of files.sort()) {
    const src = join(dir, file)
    const base = file.replace(/\.png$/, '')
    await emit(sharp(src).avif(CLOUD_AVIF), join(dir, `${base}.avif`))
    await emit(sharp(src).webp(CLOUD_WEBP), join(dir, `${base}.webp`))
  }
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

await generateCampus()
await generateClouds()

let total = 0
for (const { path, bytes } of written) {
  total += bytes
  console.log(`  ${relative(ROOT, path).replace(/\\/g, '/').padEnd(44)} ${kb(bytes)}`)
}
console.log(`\n${written.length} derivatives, ${kb(total)} on disk.`)

// The two strings that have to match the hand-written copies in the app.
const srcset = (ext) =>
  CAMPUS_WIDTHS.map((w) => `/artwork/campus/Campus-${w}.${ext} ${w}w`).join(', ')
console.log(`\nCampus AVIF srcset:\n  ${srcset('avif')}`)
console.log(`Campus WebP srcset:\n  ${srcset('webp')}`)

// The realistic first load: one campus tier + all six clouds, in one format.
for (const ext of ['avif', 'webp']) {
  const campusTop = written.find((w) => w.path.endsWith(`Campus-1672.${ext}`))
  const clouds = written
    .filter((w) => w.path.includes('clouds') && w.path.endsWith(ext))
    .reduce((sum, w) => sum + w.bytes, 0)
  const pngStat = await stat(join(ARTWORK, 'campus', 'Campus.png'))
  console.log(
    `\nFirst load, ${ext.toUpperCase()} path (widest campus tier + 6 clouds): ` +
      `${kb(campusTop.bytes + clouds)}` +
      (ext === 'avif' ? `  [campus PNG alone is ${kb(pngStat.size)}]` : ''),
  )
}
