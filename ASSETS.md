# Artwork assets

Every image originally in the read-only `artwork/` directory has been copied into
`public/artwork/`. The originals in `artwork/` are untouched and remain the source of
truth — treat `public/artwork/` as the deployable copy.

The campus/clouds distinction is preserved **as subdirectories**, matching the original
layout one-for-one:

```
artwork/campus/Campus.png    ->  public/artwork/campus/Campus.png
artwork/clouds/cloud-N.png   ->  public/artwork/clouds/cloud-N.png   (N = 1..12)
```

One file in `artwork/clouds/` is **deliberately not copied**: `clouds-all-b.png`
(2172 × 724) is a reference contact sheet showing all twelve cutouts side by side, not
a cutout itself. Nothing renders it, so it stays in `artwork/` only — it must never
reach `public/`, where it would be served, swept up by `npm run images`, and copied
into `dist/` for no reason.

Because these live under `public/`, Vite serves them verbatim at the matching URL path
and copies them into `dist/` untransformed. Reference them by absolute URL, e.g.
`/artwork/campus/Campus.png` — **not** by import.

Two further subdirectories, `public/artwork/about/` and `public/artwork/sponsors/`, hold
the event **photographs** the About us and Sponsors pages show. They are the one part of
`public/artwork/` with no counterpart in `artwork/`: their sources are the committed JPEGs
themselves, not a read-only original elsewhere. Everything else on this page applies to
them unchanged — `npm run images` writes the AVIF/WebP beside each JPEG, and the JPEG stays
as the `<picture>` fallback. See "The page photographs" below.

## The campus illustration

**`public/artwork/campus/Campus.png` is the campus illustration** — the single painterly
scene of Binghamton University under snow that the scroll-driven hero pan reveals. It is
the only *source* file in `public/artwork/campus/` (the AVIF/WebP derivatives sit beside
it — see Derivatives below), and the only non-cloud source asset.

A second campus file lives in `artwork/campus/` only:
**`Campus-upscaled-6688.webp` (6688 × 3764, lossless WebP, 25,095,724 B)** is the raw 4x
Real-ESRGAN (`realesrgan-x4plus`) enlargement of the painting, made because the hero's
start frame magnifies the artwork 3x and the 1672px source rendered visibly soft there —
conspicuously so next to the pixel-crisp cloud cutouts. (A 2x-capped master was tried
first and still read soft on 1x desktops.) It is the source for the four srcset rungs
above 1672 (see Derivatives) and is never copied to `public/` or shipped itself; it is
stored as lossless WebP rather than PNG purely because that is ~7 MB smaller in the
repository.

## The cloud cutouts

**The twelve PNGs in `public/artwork/clouds/` (`cloud-1.png` … `cloud-12.png`) are
individual cloud cutouts** — separate, independently placeable elements, each with its own alpha
channel. They are not a spritesheet and not tiles of one image; each is one cloud on a
transparent background, intended to be layered over the campus scene and parallaxed
independently.

## Inventory

| File | Dimensions (px) | Aspect ratio | File size | Color type | Alpha | Hero layer |
| --- | --- | --- | --- | --- | --- | --- |
| `public/artwork/campus/Campus.png` | 1672 × 941 | 1.777 (≈16:9) | 2,942,406 B (2.81 MiB) | 2 — truecolor RGB | No | — |
| `public/artwork/clouds/cloud-6.png` | 224 × 70 | 3.200 | 17,623 B (17.2 KiB) | 6 — truecolor RGBA | Yes | far |
| `public/artwork/clouds/cloud-12.png` | 238 × 97 | 2.454 | 26,215 B (25.6 KiB) | 6 — truecolor RGBA | Yes | far |
| `public/artwork/clouds/cloud-4.png` | 266 × 108 | 2.463 | 32,041 B (31.3 KiB) | 6 — truecolor RGBA | Yes | far |
| `public/artwork/clouds/cloud-10.png` | 291 × 167 | 1.743 | 51,509 B (50.3 KiB) | 6 — truecolor RGBA | Yes | far |
| `public/artwork/clouds/cloud-7.png` | 413 × 170 | 2.429 | 70,612 B (69.0 KiB) | 6 — truecolor RGBA | Yes | mid |
| `public/artwork/clouds/cloud-2.png` | 430 × 194 | 2.216 | 84,998 B (83.0 KiB) | 6 — truecolor RGBA | Yes | mid |
| `public/artwork/clouds/cloud-9.png` | 380 × 221 | 1.719 | 83,747 B (81.8 KiB) | 6 — truecolor RGBA | Yes | mid |
| `public/artwork/clouds/cloud-3.png` | 263 × 229 | 1.148 | 67,012 B (65.4 KiB) | 6 — truecolor RGBA | Yes | mid |
| `public/artwork/clouds/cloud-5.png` | 343 × 253 | 1.356 | 87,093 B (85.1 KiB) | 6 — truecolor RGBA | Yes | near |
| `public/artwork/clouds/cloud-1.png` | 429 × 259 | 1.656 | 107,042 B (104.5 KiB) | 6 — truecolor RGBA | Yes | near |
| `public/artwork/clouds/cloud-8.png` | 312 × 294 | 1.061 | 95,464 B (93.2 KiB) | 6 — truecolor RGBA | Yes | near |
| `public/artwork/clouds/cloud-11.png` | 342 × 303 | 1.129 | 115,138 B (112.4 KiB) | 6 — truecolor RGBA | Yes | near |

13 files, 3,780,900 bytes (3.61 MiB) total.

Listed in the order the hero casts them, which is a sort on **intrinsic height** — the
dimension that reads as scale for clouds in a horizontal sky band. It separates the
three layers in both dimensions at once: rendered at the layer scales the boxes are
123–160 px wide / 38–92 px tall (far), 210–344 / 136–183 (mid) and 359–493 / 291–348
(near), with no overlap on either axis. The aspect ratios fall in line with it — the
flat wisps (3.20, 2.45, 2.46) land in `far`, the near-square cumulus towers (1.06,
1.13, 1.36) in `near`.

Not shipped, listed for completeness:

| File | Dimensions (px) | File size | Why it stays in `artwork/` |
| --- | --- | --- | --- |
| `artwork/clouds/clouds-all-b.png` | 2172 × 724 | 453,487 B (442.9 KiB) | Reference contact sheet of all twelve cutouts, not a cutout. Never copied to `public/`, never rendered, never fed to `npm run images`. |
| `artwork/campus/Campus-upscaled-6688.webp` | 6688 × 3764 | 25,095,724 B (23.9 MiB) | 4x Real-ESRGAN enlargement of `Campus.png` (lossless WebP) — the source `npm run images` cuts the 2508/3344/5016/6688 rungs from. Never copied to `public/`; only its AVIF/WebP derivatives ship. |

All thirteen are valid PNGs at 8-bit depth, and every cutout is tightly cropped — the
ink fills its canvas. Dimensions were read directly from each file's IHDR chunk; sizes
are from the filesystem.

## The page photographs

Five JPEGs, in two directories that hold no PNG at all. They are the source files, so
unlike the illustration and the cutouts there is nothing in `artwork/` behind them. Each
is referenced from `src/lib/images.ts` (`ABOUT_PHOTOS`, `SPONSORS_PHOTO`), which also
carries its `alt` text, and each is rendered inside a `<picture>` with AVIF and WebP
sources ahead of the JPEG.

| File | Dimensions (px) | JPEG | AVIF | WebP | Used by |
| --- | --- | --- | --- | --- | --- |
| `public/artwork/about/collaborate.jpg` | 1024 × 683 | 166,855 B | 89,543 B | 71,252 B | About us — masthead, eager |
| `public/artwork/about/table.jpg` | 1024 × 768 | 266,257 B | 127,648 B | 136,812 B | About us — workshops, `loading="lazy"` |
| `public/artwork/about/hackathon.jpg` | 1024 × 683 | 214,391 B | 120,341 B | 116,448 B | About us — hackathon, `loading="lazy"` |
| `public/artwork/about/hall.jpg` | 1024 × 683 | 224,970 B | 121,151 B | 120,930 B | **nothing — see below** |
| `public/artwork/sponsors/workshop.jpg` | 1024 × 768 | 240,688 B | 131,221 B | 135,700 B | Sponsors — masthead, eager |

15 files, 2,284,207 bytes (2.18 MiB) on disk; what a visitor downloads is one derivative
per photo the page renders, so About us costs 337,532 B of AVIF across its three and
Sponsors 131,221 B for its one.

**`hall.jpg` and its two derivatives are shipped but unreferenced.** No component names it
and `src/lib/images.ts` does not list it: it is a fourth About us photo that the page as
built does not use. It costs nothing on any page load — nothing links it — but it is 467 KB
in `dist/` and it is the one exception to this file's otherwise exact
shipped-equals-referenced accounting. Either give it a place on the page or delete all
three files; do not leave it as a permanent third state.

Both directories predate the AVIF/WebP quality settings being written down for photographs
specifically: `scripts/generate-images.mjs` reuses the campus encoder settings (`AVIF`
q68, `CAMPUS_WEBP` q82) for them, which is why the WebP is *larger* than the AVIF on four
of the five. `<picture>` offers AVIF first, so the WebP is only ever fetched by a browser
that has no AVIF at all, and the ordering costs those browsers nothing they would not have
paid for the JPEG.

## Derivatives

`npm run images` (`scripts/generate-images.mjs`, using `sharp` as a devDependency)
writes AVIF and WebP derivatives **beside** each PNG. The PNGs above are untouched and
remain the last-resort `<img src>` inside each `<picture>`. The derivatives are
committed, so a deploy does not need to run `npm run images` — the build runs
`npm run build` (lint, `tsc -b`, `vite build`, then the prerender step — a lint warning
fails the deploy too) and nothing else.

| Output | Widths | Encoder | Total |
| --- | --- | --- | --- |
| `campus/Campus-{640,…,3344,5016,6688}.avif` | 8 | AVIF q68 | 5,447 KB |
| `campus/Campus-{640,…,3344,5016,6688}.webp` | 8 | WebP q82 | 5,802 KB |
| `clouds/cloud-N.avif` | 1 each (intrinsic) × 12 | AVIF q70 | 169 KB |
| `clouds/cloud-N.webp` | 1 each (intrinsic) × 12 | WebP q82, alphaQuality 90 | 256 KB |
| `about/{collaborate,table,hackathon,hall}.avif` | 1 each (intrinsic) × 4 | AVIF q68 | 448 KB |
| `about/{collaborate,table,hackathon,hall}.webp` | 1 each (intrinsic) × 4 | WebP q82 | 435 KB |
| `sponsors/workshop.avif` | 1 (intrinsic) | AVIF q68 | 128 KB |
| `sponsors/workshop.webp` | 1 (intrinsic) | WebP q82 | 133 KB |

The campus ladder tops out at **6688px**, four times the painted source's 1672: the
rungs at and below 1672 are cut from `Campus.png`, and the 2508/3344/5016/6688 rungs
from `artwork/campus/Campus-upscaled-6688.webp` (see "The campus illustration" above).
The hero magnifies the artwork up to 3x at its start frame, which is why `sizes`
(`CAMPUS_SIZES` in `src/lib/images.ts`, mirrored by the preload's `imagesizes` in
`index.html`) quotes the drawn width times 3 for laptop-and-up screens — a 1440x900 @1x
display selects 5016, anything wider or denser 6688. Small screens are deliberately
capped by the leading `1114px` entries (one for portrait width, one for landscape
height): a phone's `object-cover` crop discards ~74% of the drawn width, so the heavy
top rungs would be mostly cropped bytes — DPR-2 phones land on 2508 and DPR-3 phones on
3344 instead.
The clouds render at up to 1.15x their intrinsic width, so they get one derivative each
and their `<picture>` switches on format only, with no `srcset`.

**Measured first load of the landing page** (dev server, Chromium, after the 4x rungs
landed): 13 image requests either way, split by screen class —

- **Desktop** (verified at 1900x912 @1x and 1440x900 @2x, both selecting
  `Campus-6688.avif`): **2,251,760 bytes (2,199 KB)** — the 6688 AVIF (2,078,541 B)
  plus the twelve cloud AVIFs (173,219 B), each fetched exactly once. That is **143% of
  the 1.5 MB budget: the budget is deliberately exceeded on desktop**, traded for a
  start frame that is not visibly soft next to the pixel-crisp cloud cutouts. A
  1440x900 @1x laptop selects 5016 (1,344,385 B; 1,482 KB first load, 97% of budget).
- **Phone** (verified at 390x844 @3x and 844x390 @3x, both capped to
  `Campus-3344.avif`): **1,014,069 bytes (990 KB)** — 66% of the budget, unchanged in
  spirit from the 3344-ceiling ladder.

(History: 495,259 B / 32% of budget when the ladder topped out at the painted 1672;
1,033,102 B / 66% everywhere at the 3344 ceiling; only the campus tier has changed
across all three.)

Every cloud loads on first paint whatever the viewport: the drift track mounts
`SET_COUNT` copies of each cutout, but they share one URL each, so the request count is
the cutout count and not the node count.

## The brand marks

`brand-source/` is a second read-only source directory, holding the three HackBU brand
files. Unlike `artwork/`, nothing in it is copied verbatim into `public/` — everything the
site ships is derived, by the same `npm run images` run.

| File | Dimensions (px) | Ink box (trimmed) | Colour | Alpha |
| --- | --- | --- | --- | --- |
| `brand-source/icon.png` | 1920 × 2033 | 1741 × 1828 (0.95241) | `#339966`, one stroke colour | Yes |
| `brand-source/text.png` | 7690 × 1080 | 7690 × 1080 (7.12037) — no padding | `#42B872`, one stroke colour | Yes |
| `brand-source/icon_discord.png` | 732 × 732 | n/a — opaque tile | `#97F5AC` tile, `#50B536` mark | Yes — channel present, fully opaque |

The two greens are not the same, and neither is a palette colour. The page does not
reconcile them in the pixels: the marks render as `mask-image` shapes filled with the
`fern` token, so the derivatives below carry **alpha only** — their RGB is flattened to
white before encoding, which `mask-image` never reads.

| Output | Size | From | Bytes |
| --- | --- | --- | --- |
| `brand/bearcat-mask-64.png` | 64 × 67 | `icon.png`, trimmed | 3,164 |
| `brand/bearcat-mask-128.png` | 128 × 134 | `icon.png`, trimmed | 6,941 |
| `brand/wordmark-mask-192.png` | 192 × 27 | `text.png` | 2,147 |
| `brand/wordmark-mask-384.png` | 384 × 54 | `text.png` | 4,850 |
| `brand/favicon-32.png` | 32 × 32 | `icon.png`, trimmed and squared | 1,824 |
| `brand/favicon-64.png` | 64 × 64 | `icon.png`, trimmed and squared | 4,601 |
| `brand/apple-touch-icon.png` | 180 × 180 | `icon_discord.png` | 7,805 |
| `brand/og-image.png` | 732 × 732 | `icon_discord.png` | 10,014 |

The mask rungs are `[1x, 2x]` against the largest place each mark is drawn — the `sm`
header lockup, where the bearcat is 35.7 CSS px wide and the wordmark 153.8. One rung of
each loads per device: **5.2 KB at 1x, 11.5 KB at 2x**, on top of the artwork's 483.7 KB.

`icon_discord.png` is 2,158,148 bytes as delivered, for a 14-colour 732 × 732 image;
re-encoding it as a palette PNG is what turns it into the 10 KB social card above.

## Notes

Observations from the raw files. The two questions this section used to raise are both
settled — recorded here as fact rather than as open questions:

- **The hero is a vertical scale-pan, not a horizontal scroll-pan.** Campus.png is 1672 px
  wide and has no alpha; a horizontal scroll-pan would have had limited travel before
  upscaling past 1:1 on a wide desktop viewport. `src/components/Hero.tsx` instead scales
  the illustration up from a fixed top edge (`object-position: 52% 0%` +
  `transform-origin: top`, no translation at all), which fits the source dimensions.
- **At 2.81 MiB, Campus.png is 78% of the artwork bytes** (2,942,406 / 3,780,900 —
  `ASSETS.md:57`'s total — = 77.8%, rounded). It is also the largest-contentful-paint
  candidate; AVIF/WebP derivatives beside it are what keep the transferred weight far
  below that, per Derivatives above.
- The clouds are small (70–303 px tall) and will be visibly soft if scaled far above 1:1.
