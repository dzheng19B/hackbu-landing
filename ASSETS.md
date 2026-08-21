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
