# Artwork assets

Every image originally in the read-only `artwork/` directory has been copied into
`public/artwork/`. The originals in `artwork/` are untouched and remain the source of
truth — treat `public/artwork/` as the deployable copy.

The campus/clouds distinction is preserved **as subdirectories**, matching the original
layout one-for-one:

```
artwork/campus/Campus.png    ->  public/artwork/campus/Campus.png
artwork/clouds/cloud-N.png   ->  public/artwork/clouds/cloud-N.png   (N = 1..6)
```

Because these live under `public/`, Vite serves them verbatim at the matching URL path
and copies them into `dist/` untransformed. Reference them by absolute URL, e.g.
`/artwork/campus/Campus.png` — **not** by import.

## The campus illustration

**`public/artwork/campus/Campus.png` is the campus illustration** — the single painterly
scene of Binghamton University under snow that the scroll-driven hero pan reveals. It is
the only file in `public/artwork/campus/`, and the only non-cloud asset.

## The cloud cutouts

**The six files in `public/artwork/clouds/` (`cloud-1.png` … `cloud-6.png`) are individual
cloud cutouts** — separate, independently placeable elements, each with its own alpha
channel. They are not a spritesheet and not tiles of one image; each is one cloud on a
transparent background, intended to be layered over the campus scene and parallaxed
independently.

## Inventory

| File | Dimensions (px) | Aspect ratio | File size | Color type | Alpha |
| --- | --- | --- | --- | --- | --- |
| `public/artwork/campus/Campus.png` | 1672 × 941 | 1.777 (≈16:9) | 2,942,406 B (2.81 MiB) | 2 — truecolor RGB | No |
| `public/artwork/clouds/cloud-1.png` | 429 × 259 | 1.656 | 107,042 B (104.5 KiB) | 6 — truecolor RGBA | Yes |
| `public/artwork/clouds/cloud-2.png` | 430 × 194 | 2.216 | 84,998 B (83.0 KiB) | 6 — truecolor RGBA | Yes |
| `public/artwork/clouds/cloud-3.png` | 263 × 229 | 1.148 | 67,012 B (65.4 KiB) | 6 — truecolor RGBA | Yes |
| `public/artwork/clouds/cloud-4.png` | 266 × 108 | 2.463 | 32,041 B (31.3 KiB) | 6 — truecolor RGBA | Yes |
| `public/artwork/clouds/cloud-5.png` | 343 × 253 | 1.356 | 87,093 B (85.1 KiB) | 6 — truecolor RGBA | Yes |
| `public/artwork/clouds/cloud-6.png` | 224 × 70 | 3.200 | 17,623 B (17.2 KiB) | 6 — truecolor RGBA | Yes |

7 files, 3,338,215 bytes (3.18 MiB) total.

All seven are valid PNGs at 8-bit depth. Dimensions were read directly from each file's
IHDR chunk; sizes are from the filesystem.

## Derivatives (Phase 6)

`npm run images` (`scripts/generate-images.mjs`, using `sharp` as a devDependency)
writes AVIF and WebP derivatives **beside** each PNG. The PNGs above are untouched and
remain the last-resort `<img src>` inside each `<picture>`. The derivatives are
committed, so a deploy runs `vite build` and nothing else.

| Output | Widths | Encoder | Total |
| --- | --- | --- | --- |
| `campus/Campus-{640,960,1280,1672}.avif` | 4 | AVIF q68 | 738 KB |
| `campus/Campus-{640,960,1280,1672}.webp` | 4 | WebP q82 | 790 KB |
| `clouds/cloud-N.avif` | 1 each (intrinsic) | AVIF q70 | 78 KB |
| `clouds/cloud-N.webp` | 1 each (intrinsic) | WebP q82, alphaQuality 90 | 122 KB |

The campus ladder stops at the intrinsic **1672px**: the hero magnifies the artwork up
to 3x, so no viewport wants fewer pixels than the source has and none can be given more.
The clouds render at up to 1.15x their intrinsic width, so they get one derivative each
and their `<picture>` switches on format only, with no `srcset`.

**Measured first load** (production build, Chrome, both 1440x900 and 390x844): 7 image
requests, **401,963 bytes (392.5 KB)** — the widest campus AVIF plus the six cloud
AVIFs, each fetched exactly once. That is 12% of the 3.18 MB the PNGs would have cost
and 26% of the 1.5 MB budget.

## The brand marks

`brand-source/` is a second read-only source directory, holding the three HackBU brand
files. Unlike `artwork/`, nothing in it is copied verbatim into `public/` — everything the
site ships is derived, by the same `npm run images` run.

| File | Dimensions (px) | Ink box (trimmed) | Colour | Alpha |
| --- | --- | --- | --- | --- |
| `brand-source/icon.png` | 1920 × 2033 | 1741 × 1828 (0.95241) | `#339966`, one stroke colour | Yes |
| `brand-source/text.png` | 7690 × 1080 | 7690 × 1080 (7.12037) — no padding | `#42B872`, one stroke colour | Yes |
| `brand-source/icon_discord.png` | 732 × 732 | n/a — opaque tile | `#97F5AC` tile, `#50B536` mark | No (opaque) |

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
each loads per device: **5.3 KB at 1x, 11.7 KB at 2x**, on top of the artwork's 392.5 KB.

`icon_discord.png` is 2,158,148 bytes as delivered, for a 14-colour 732 × 732 image;
re-encoding it as a palette PNG is what turns it into the 10 KB social card above.

## Notes for later phases

These are observations from the raw files, not design decisions:

- **Campus.png is 1672 px wide and has no alpha.** At 16:9 it is roughly one screen-width
  of image. A horizontal scroll-pan has limited travel before it upscales past 1:1 on a
  wide desktop viewport; a vertical pan or a scale-and-translate reveal fits the source
  dimensions better. Worth confirming against the intended motion before building it.
- **At 2.81 MiB, Campus.png dominates page weight** — it is 88% of the artwork bytes and
  will gate largest-contentful-paint. Compressing it or emitting a WebP/AVIF alongside is
  the obvious lever if load time matters.
- The clouds are small (70–259 px tall) and will be visibly soft if scaled far above 1:1.
