import { useState, type CSSProperties } from 'react'
import { m, useMotionValueEvent, useTransform } from 'motion/react'
import { cloudSources } from '../lib/images'
import { rangeProgress, useHeroScroll } from '../lib/motion'

/**
 * The hero's drifting cloud parallax.
 *
 * This component *is* the `data-hero-clouds` layer of the hero stage: it mounts
 * over the campus artwork and is the topmost layer of it (see Hero.tsx for the
 * layer contract), rendering three depth layers of cloud cutouts over the sky.
 * There is nothing above it — the pine legibility scrim that used to sit there
 * went when the hero copy moved out to <AboutSection>.
 *
 * Two independent motions compose here, and they are deliberately kept on
 * separate elements so they never fight over one transform:
 *
 *   [data-cloud-layer]   scroll-linked. translateY + opacity, driven by the
 *                        hero's scroll progress. This is the layer that lifts
 *                        the clouds out of frame and fades them before the pan
 *                        uncovers the campus.
 *     [data-cloud-drift] time-linked. translateX only, linear, and looping for
 *                        as long as the layer above it is visible — it stops
 *                        once that layer's fade has reached zero and starts
 *                        again if the reader scrolls back. See `CloudLayer`.
 *       [CloudSet] xN    the repeated tiles that make the drift seamless.
 *
 * Only `transform` and `opacity` are ever animated. There is no scroll event
 * listener anywhere — the scroll-linked half reads `useHeroScroll()`, which is
 * fed by the single `useScroll` subscription <Hero> already owns.
 */

/* -------------------------------------------------------------------------- */
/* Sizing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The stage the clouds are tuned against. Every `left` below is a percentage of
 * the stage width, so composition is resolution-independent, but the cloud
 * *sizes* are absolute — a cloud is a fixed-size object, not a fraction of the
 * window. `REFERENCE_HEIGHT` is only used by the reduced-motion resting frame,
 * which is sized against the stage height instead (see `restingHeight`).
 */
const REFERENCE_WIDTH = 1440
const REFERENCE_HEIGHT = 900

/**
 * Below `REFERENCE_WIDTH / SHRINK_BELOW` px the clouds start scaling with the
 * viewport instead of holding their pixel size, so a 493px near cloud does not
 * swallow a 390px phone. `min()` keeps the two regimes on one declaration and,
 * because the vw term is derived from each cloud's own width, the three layers
 * keep their relative sizes at every viewport.
 *
 * This is a static `width`, not an animated one — nothing here animates size.
 */
const SHRINK_BELOW = 2

/**
 * The vw half of that `min()`, as the number actually emitted into the
 * stylesheet. The loop arithmetic below reasons about cloud boxes as fractions
 * of the stage width, and it must reason about the *emitted* value, not an
 * unrounded ideal, or the proof would be about a stylesheet we never shipped.
 */
function cloudWidthVw(renderedPx: number): number {
  return Number(
    (((renderedPx / REFERENCE_WIDTH) * 100 * SHRINK_BELOW).toFixed(2)),
  )
}

function cloudWidth(renderedPx: number): string {
  return `min(${renderedPx}px, ${cloudWidthVw(renderedPx)}vw)`
}

/* -------------------------------------------------------------------------- */
/* Layer + cloud specs                                                        */
/* -------------------------------------------------------------------------- */

type CloudSpec = {
  /** File name under /artwork/clouds. */
  file: string
  /** Intrinsic pixel dimensions, straight from ASSETS.md. */
  width: number
  height: number
  /** Position within one set. `left` is a % of the stage width, `top` of its height. */
  left: string
  top: string
  /**
   * Where this cloud sits in the reduced-motion resting frame. `left` is a % of
   * the stage width; `bottom` is a % of the stage height, measured from the
   * bottom of the stage — so it pins the cloud's *lower* edge, which is the
   * edge that has to stay above the ridgeline. See RESTING_FRAME below.
   */
  restingLeft: string
  restingBottom: string
}

type CloudLayerSpec = {
  id: string
  /** Multiplier on each cutout's intrinsic width. far < mid < near. */
  scale: number
  /** Resting opacity of the whole layer. far < mid < near. */
  opacity: number
  /**
   * Seconds for one full loop — one stage width of travel, so a layer's speed
   * is exactly `1 / driftSeconds`. Every layer travels the same distance
   * (`SET_COUNT` is global), which is what makes that proportionality hold.
   *
   * These are derived from `scale`, not chosen: parallax reads as depth only
   * when apparent speed is proportional to apparent size, because both scale
   * with 1/distance. So `driftSeconds ∝ 1 / scale`, anchored at near = 90s:
   *
   *   far   90 x (1.15 / 0.55) = 188s
   *   mid   90 x (1.15 / 0.80) = 129s
   *   near                        90s
   *
   * That gives a far:near speed ratio of 2.09x, matching the 2.09x size ratio.
   * Merely ordering them (the original 88/74/62 — a 1.42x spread against a
   * 2.09x size spread) left the near layer looking too slow for its size, and
   * the effect read as drift rather than as depth.
   *
   * The anchor is the one number to turn here. It was 60s; at 90s every layer
   * is exactly 1.5x slower and the proportionality is untouched, because all
   * three are derived from it. Raise it to slow the sky down further, lower it
   * to liven it up — but change the anchor, not the individual layers, or the
   * speed/size match that produces the depth is what breaks.
   *
   * The fastest layer now sits at the top of the brief's 60-90s band rather
   * than its floor, which puts `far` well beyond it. The band existed to keep
   * the drift slow, and 188s is slower still, so the intent is intact.
   */
  driftSeconds: number
  /** How far the layer lifts (as a % of stage height) while it fades out. */
  rise: number
  /** Raw hero-track progress over which the layer fades to nothing. */
  fadeStart: number
  fadeEnd: number
  clouds: CloudSpec[]
}

/**
 * Three depth layers, four cutouts each — twelve clouds, cast by size.
 *
 *     far   cloud-6, cloud-12, cloud-4,  cloud-10
 *     mid   cloud-7, cloud-2,  cloud-9,  cloud-3
 *     near  cloud-5, cloud-8,  cloud-11, cloud-1
 *
 * The casting is a sort on **intrinsic height**, not width, because height is
 * what reads as scale for clouds sitting in a horizontal sky band. Sorting on
 * height happens to separate the layers in *both* dimensions, which a
 * width-based sort does not — at and above `REFERENCE_WIDTH` the rendered
 * boxes are:
 *
 *     far    123-160 px wide    38-92 px tall
 *     mid    210-344 px wide   136-183 px tall
 *     near   359-493 px wide   291-348 px tall
 *
 * so no cloud in a nearer layer is ever drawn smaller than one in a more
 * distant layer, on either axis. (The tightest margin is width, 344 -> 359
 * across the mid/near boundary; the height margins are 44px and 108px.)
 *
 * The sort also lands where shape says it should. `far` gets the flat wisps —
 * cloud-6 at 3.20:1, cloud-12 at 2.45:1, cloud-4 at 2.46:1, cloud-10 at
 * 1.74:1 — which is what distant cloud reads as. `near` gets the tall cumulus
 * towers: cloud-11 at 1.13:1, cloud-8 at 1.06:1, cloud-5 at 1.36:1, cloud-1 at
 * 1.66:1. `mid` takes the four in between.
 *
 * `scale`, `opacity` and speed all rise together toward the viewer, and speed
 * is derived from `scale` rather than picked — see `driftSeconds` above.
 *
 * ---------------------------------------------------------------------------
 * Why all three layers still render at every viewport
 * ---------------------------------------------------------------------------
 * Whether small screens should drop a layer was measured, at six clouds, and
 * answered no. Twelve clouds doubles the mounted node count and the layer
 * coverage, so the measurement below is retaken at twelve rather than
 * inherited from that answer.
 *
 * At 390x844, with `SET_COUNT` = 4, **48 `<img>` nodes are mounted and 16 of
 * them intersect the stage box** — the other 32 are tiles the stage clips
 * whole, so they cost layout, not paint. (At 1440x900 it is 14 of 48.) The 16
 * that do paint cover 66.4% of one stage in bounding boxes; weighted by each
 * cutout's mean alpha — the cheap pixels in a cloud PNG are the transparent
 * ones — the real blend is **29.6% of one viewport**, split:
 *
 *     near  46.30% bbox / 20.84% alpha-weighted   (4 cutouts, 7 copies)
 *     mid   16.97% bbox /  7.47%                  (4 cutouts, 5 copies)
 *     far    3.12% bbox /  1.31%                  (4 cutouts, 4 copies)
 *
 * That is up from 8 painting nodes and 32.66% bbox at six clouds — the node
 * count doubled and the coverage roughly doubled with it, but the total is
 * still under one third of a single full-screen alpha pass, and the twelve
 * decoded bitmaps are shared across all 48 nodes rather than allocated per
 * node. The layer a reduction would take is still `far`: four cutouts worth
 * **1.31%** of one viewport of blending, up from 1.19%. Dropping it still
 * cannot buy a frame. Dropping `near` might — and `near` is the parallax. So
 * the count stands at every width, and the honest reason is that the growth
 * landed on a budget that was never close to spent.
 *
 * (Frame rate itself was not measurable in the verification browser — it runs
 * with `document.hidden`, so `requestAnimationFrame` never fires and motion's
 * loop is frozen. This is a fill-rate and node-count argument, not a profile.)
 *
 * ---------------------------------------------------------------------------
 * The sky band
 * ---------------------------------------------------------------------------
 * Vertical placement keeps every cloud over sky. At the pan's starting scale of
 * 3 the stage shows image rows 0..f1/3 (see PAN_START_SCALE in Hero.tsx), and
 * the first silhouette pixel of the hills is source row 270 of 1086 = 0.2486
 * of the image height, so **the ridgeline breaks the stage at 74.58% of its
 * height** at every aspect at or below the artwork's 4:3, and lower still on
 * wider ones (image row r maps to stage rS/f1, and f1 < 1 only pushes it
 * down). 74.58% is the number the placement is checked against.
 *
 * At 1440x900 the lowest cloud edge is **43.64%** of the stage height
 * (cloud-9, mid), clearing the ridgeline by 30.94 points; cloud-8 and cloud-1
 * are next at 43.6% and 43.1%. The viewport thresholds below were derived
 * against the previous artwork's 58.02% band: every cloud cleared at every
 * viewport whose stage was at least **650 CSS px tall** (352px below 720px
 * wide, where the clouds scale with the viewport). The current band is 16.56
 * points deeper, so those thresholds still hold and are now conservative —
 * the placement was left untouched through the artwork swap precisely because
 * the sky only grew.
 */
const CLOUD_LAYERS: CloudLayerSpec[] = [
  {
    id: 'far',
    scale: 0.55,
    opacity: 0.5,
    driftSeconds: 188,
    rise: 10,
    fadeStart: 0.04,
    fadeEnd: 0.3,
    clouds: [
      {
        file: 'cloud-6.png',
        width: 224,
        height: 70,
        left: '8%',
        top: '27%',
        restingLeft: '11.5%',
        restingBottom: '89%',
      },
      {
        file: 'cloud-12.png',
        width: 238,
        height: 97,
        left: '30%',
        top: '17%',
        restingLeft: '25.5%',
        restingBottom: '88%',
      },
      {
        file: 'cloud-4.png',
        width: 266,
        height: 108,
        left: '52%',
        top: '13%',
        restingLeft: '74.5%',
        restingBottom: '88.5%',
      },
      {
        file: 'cloud-10.png',
        width: 291,
        height: 167,
        left: '77%',
        top: '30%',
        restingLeft: '50%',
        restingBottom: '87%',
      },
    ],
  },
  {
    id: 'mid',
    scale: 0.8,
    opacity: 0.75,
    driftSeconds: 129,
    rise: 16,
    fadeStart: 0.02,
    fadeEnd: 0.26,
    clouds: [
      {
        file: 'cloud-7.png',
        width: 413,
        height: 170,
        left: '3%',
        top: '20%',
        restingLeft: '65.5%',
        restingBottom: '85%',
      },
      {
        file: 'cloud-2.png',
        width: 430,
        height: 194,
        left: '30%',
        top: '9%',
        restingLeft: '16%',
        restingBottom: '84.5%',
      },
      {
        file: 'cloud-9.png',
        width: 380,
        height: 221,
        left: '57%',
        top: '24%',
        restingLeft: '90.5%',
        restingBottom: '84%',
      },
      {
        file: 'cloud-3.png',
        width: 263,
        height: 229,
        left: '82%',
        top: '14%',
        restingLeft: '43.5%',
        restingBottom: '85.5%',
      },
    ],
  },
  {
    id: 'near',
    scale: 1.15,
    opacity: 1,
    driftSeconds: 90,
    rise: 24,
    fadeStart: 0.01,
    fadeEnd: 0.22,
    /**
     * The two clouds at the ends of this layer are deliberately hung off a
     * viewport edge, so the layer reads as passing in front of the camera
     * rather than as a tidy vignette. At 1440px: cloud-5 renders 394px wide at
     * left -115.2px (115.2px clipped by the left edge) and cloud-1 renders
     * 493px wide at left 1065.6px, running to 1558.6px — 118.6px past the
     * right edge.
     *
     * That overhang is exactly why the drift track needs more than two tiles;
     * see `TILE_OVERHANG` below.
     *
     * Four near clouds total 1639px of rendered width against a 1440px tile,
     * so the layer cannot be laid out without something overlapping. The
     * arrangement puts all of that overlap at the tile seam, where cloud-1's
     * tail runs over the head of the *next* tile's cloud-5 (233.8px of overlap,
     * of which only 115.2px is ever on screen at once) and leaves the three
     * interior junctions as real gaps: 9.2px, 15.4px, 10.2px. Those gaps are
     * narrow, so vertical separation does the rest of the work — the tops run
     * 0% -> 6% -> 2% -> 10% left to right, which staggers the four bases by up
     * to 90px and stops the layer reading as one continuous bank.
     */
    clouds: [
      {
        file: 'cloud-5.png',
        width: 343,
        height: 253,
        left: '-8%',
        top: '0%',
        restingLeft: '0.7%',
        restingBottom: '82.5%',
      },
      {
        file: 'cloud-8.png',
        width: 312,
        height: 294,
        left: '20%',
        top: '6%',
        restingLeft: '55.5%',
        restingBottom: '82.2%',
      },
      {
        file: 'cloud-11.png',
        width: 342,
        height: 303,
        left: '46%',
        top: '2%',
        restingLeft: '79.5%',
        restingBottom: '82%',
      },
      {
        file: 'cloud-1.png',
        width: 429,
        height: 259,
        left: '74%',
        top: '10%',
        restingLeft: '30.5%',
        restingBottom: '83%',
      },
    ],
  },
]

/** Every cloud's rendered width, in px, at and above `REFERENCE_WIDTH`. */
function renderedWidth(layer: CloudLayerSpec, cloud: CloudSpec): number {
  return Math.round(cloud.width * layer.scale)
}

/* -------------------------------------------------------------------------- */
/* The seamless loop                                                          */
/* -------------------------------------------------------------------------- */

/**
 * How far the clouds hang outside the tile they belong to, as a fraction of the
 * stage width `W`, taken over every cloud in every layer.
 *
 * A cloud's box within its own tile is `[L·W, L·W + w]`, where `L` is its
 * `left` fraction and `w` its used width. `w` is `min(px, vw)`, so `w/W` is at
 * its largest in the vw regime, where it equals `cloudWidthVw/100` exactly and
 * is independent of `W`. Above the crossover `w/W = px/W` only shrinks. So the
 * worst case over *all* viewport widths is:
 *
 *     left overhang  = max(0, -L)
 *     right overhang = max(0, L + vwFraction - 1)
 *
 * Measured over the specs above that is left 0.08 (cloud-5, `left: -8%`) and
 * right 0.4247 (cloud-1, `left: 74%` + `68.47vw`). One other cloud overhangs —
 * cloud-3, `left: 82%` + `29.17vw`, for 0.1117 on the right — and the far layer
 * is clear on both sides. Only the maxima matter, so the loop is still sized by
 * the near layer alone.
 */
type TileOverhang = { left: number; right: number }

function measureTileOverhang(layers: CloudLayerSpec[]): TileOverhang {
  let left = 0
  let right = 0
  for (const layer of layers) {
    for (const cloud of layer.clouds) {
      const leftFraction = Number.parseFloat(cloud.left) / 100
      const widthFraction = cloudWidthVw(renderedWidth(layer, cloud)) / 100
      left = Math.max(left, -leftFraction)
      right = Math.max(right, leftFraction + widthFraction - 1)
    }
  }
  return { left: Math.max(0, left), right: Math.max(0, right) }
}

const TILE_OVERHANG = measureTileOverhang(CLOUD_LAYERS)

/**
 * How the horizontal loop is built, and why it cannot seam.
 *
 * A layer's drift track holds `SET_COUNT` identical `CloudSet` tiles, each
 * exactly one stage width `W` wide, tile `k` offset by `translateX(k·100%)` of
 * its own width — so tile `k` occupies track coordinates `[k·W, (k+1)·W)`. The
 * track animates `x` from `-LEAD_SETS·W` to `-(LEAD_SETS + 1)·W`, i.e. the
 * viewport window walks from track span `[LEAD·W, (LEAD+1)·W)` to
 * `[(LEAD+1)·W, (LEAD+2)·W)` — exactly one tile of travel.
 *
 * **Why two tiles was not enough.** The old build was two tiles animating
 * `0% → -50%`, and the note here claimed "the same overlap exists at both ends
 * of the cycle". That is only true when every cloud's box lies inside `[0, W)`
 * of its own tile, which the near layer deliberately breaks in order to get the
 * viewport-edge crop. With clouds hanging out of the tile, the start frame
 * wanted a tile at `-W` to supply cloud-1's tail and the end frame wanted a
 * tile at `+2W` to supply cloud-5's head; neither existed, so a slice of
 * cloud-5 popped in at the right edge and a slice of cloud-1 popped out at the
 * left edge, once every near-layer loop. At the current placement those slices
 * would be 115.2 x 291px and 118.6 x 298px.
 *
 * **Why this construction is exact.** Write the measured overhangs as `oL` and
 * `oR`, so every cloud's box within its own tile is `[p, p + w]` with
 * `-oL·W < p` and `p + w < (1 + oR)·W`. A copy of that cloud exists at
 * `k·W + p` for every `k` in `[0, SET_COUNT)`, and a copy intersects the
 * viewport window `[a·W, (a+1)·W)` exactly when
 *
 *     a - 1 - oR  <  k  <  a + 1 + oL
 *
 * so the copies a window can see are `k ∈ [a - ⌈oR⌉, a + ⌈oL⌉]`. Taking
 * `LEAD_SETS = ⌈oR⌉` and `SET_COUNT = ⌈oR⌉ + ⌈oL⌉ + 2` puts every `k` the start
 * window (`a = LEAD_SETS`) and the end window (`a = LEAD_SETS + 1`) can reach
 * inside `[0, SET_COUNT)` — so every copy either frame needs is mounted. And
 * `k ↦ k + 1` is then a bijection between the copies visible in the start
 * window and those visible in the end window, carrying each to the same screen
 * position, which makes the two frames element-for-element identical. The
 * keyframe jump back to `LOOP_START` swaps two identical frames.
 *
 * With the specs above `oR = 0.4247` and `oL = 0.08`, so `LEAD_SETS = 1` and
 * `SET_COUNT = 4`: a `400%` track animating `-25% → -50%`. Both endpoints are
 * exact quarters of the track, and a percentage translate resolves against the
 * element's own border box, so `-25%` of a `4W` track is exactly `-W`.
 *
 * It is derived, not hardcoded: add a cloud that hangs further out and the
 * track widens to match. If nothing overhangs at all this collapses to the
 * original two-tile `0% → -50%` loop.
 *
 * Easing is `linear`, so velocity is constant across the wrap too — no
 * ease-out/ease-in stutter at the seam.
 */
const LEAD_SETS = Math.ceil(TILE_OVERHANG.right)
const TRAIL_SETS = Math.ceil(TILE_OVERHANG.left)
const SET_COUNT = LEAD_SETS + TRAIL_SETS + 2

function trackPercent(sets: number): string {
  return `${Number(((sets / SET_COUNT) * -100).toFixed(6))}%`
}

const LOOP_START = trackPercent(LEAD_SETS)
const LOOP_END = trackPercent(LEAD_SETS + 1)

/* -------------------------------------------------------------------------- */
/* The reduced-motion resting frame                                           */
/* -------------------------------------------------------------------------- */

/**
 * Under `prefers-reduced-motion: reduce` <Hero> pins its pan to the *end* of
 * the animation: scale 1, the whole campus in frame. The clouds have to rest in
 * that same picture, so they cannot simply hold their start-of-animation
 * placement — that was authored against a 3x campus showing only its top third,
 * and dropped onto the 1x campus it lands on hills, treeline and dorm roofs.
 *
 * Two things change, and only for this branch:
 *
 * 1. **Size.** The pan's resting scale is 1 where the animation starts at 3, so
 *    the whole scene is a third of the size it was. The clouds follow the same
 *    camera: `RESTING_SCALE = 1/3`. The sky band is about 188px tall at
 *    1440x900 once the header has taken its bite, so at full size the near
 *    clouds — 291px to 348px — could not sit in it.
 * 2. **Position.** Each cloud is pinned by its *bottom* edge to a percentage of
 *    the stage height, so the edge that matters — the low one — is placed
 *    directly rather than inferred from a `top` plus a height.
 *
 * Where the band is, measured off Campus.png (1448 x 1086) rather than
 * guessed: the hill silhouette breaks the horizon at source row 270, i.e.
 * **0.2486** of the image height, and the first brick-coloured pixel of the
 * dormitories is at row 383 (**0.3527**). At scale 1 the artwork is 4:3, so a
 * portrait stage is height-constrained and image fraction `f` lands at stage
 * `f·H`, while a landscape stage is width-constrained and `f` lands *lower*,
 * at `f·H/f1`. Every `restingBottom` above is >= 82% (bottom edge at or above
 * 0.18·H), clearing the ridgeline by at least 6.86% of the stage height — the
 * portrait worst case; at 1440x900 (f1 = 0.8333) the ridge sits at 29.84% and
 * the clearance is 11.84%, 107px — and the first brick by at least 17.3%.
 *
 * All twelve clouds are placed here, interleaved across the width rather than
 * grouped by layer, so neighbours differ in depth and size: cloud-5, cloud-6,
 * cloud-2, cloud-12, cloud-1, cloud-3, cloud-10, cloud-8, cloud-7, cloud-4,
 * cloud-11, cloud-9. They sum to 78-80% of the stage width, and the placement
 * leaves **no two of them overlapping at all** — measured on the 1425px stage a
 * 1440x900 window actually gives, the tightest gap between neighbours is 18.3px
 * and the widest 27.6px.
 *
 * The heights are `min()` of two terms, and both are needed:
 *
 *   - a percentage of the *stage height*, which is what makes the ridgeline
 *     clearance a ratio that holds at every viewport rather than only at the
 *     reference one;
 *   - a `vw` value equal to that same size at 1440x900, which is what makes the
 *     *horizontal* composition hold. Without it a cloud's width as a fraction
 *     of the stage grows with `H/W`: at 390x844 the boxes would be 3.46x wider
 *     relative to the stage than they are here, the twelve would sum to 271% of
 *     it, and the sky would collapse into one bank. With it they still sum to
 *     78.4%, and the twelve are measurably non-overlapping at 390x844 (gaps
 *     5.3-7.7px) and at 768x1024 (9.2-14.4px) as well as at the reference.
 *
 * The two terms cross exactly at the 1440x900 reference: taller viewports take
 * the `vw` term, wider-and-shorter ones the percentage. Either way the term
 * that wins is the *smaller*, and since these are bottom-pinned, shrinking only
 * moves a cloud's top edge down. The ridgeline clearance is untouched by which
 * term binds.
 *
 * The fixed site header is an opaque `bg-cloud` bar 81px tall (`h-20` + a 1px
 * border; 65px below `sm`) across the top of the stage. The layers are stacked
 * so the far clouds sit clear of it and the four tall near clouds tuck their
 * tops a little way behind it — at 1440x900 the least-visible cloud, cloud-1,
 * still shows 72px of its 99px height below the header.
 *
 * (The top-edge pin from the pan is what keeps ultrawide safe here too: at
 * 2545x1080 (f1 = 0.5659) the resting frame shows image rows 0..0.566 and the
 * ridgeline lands at 43.9% of the stage height. Every `restingBottom` above
 * puts its cloud's lower edge in the top 18%, so the clearance over the
 * ridgeline only grows as the viewport widens.)
 */
const RESTING_SCALE = 1 / 3

function restingHeight(layer: CloudLayerSpec, cloud: CloudSpec): string {
  const px =
    renderedWidth(layer, cloud) * (cloud.height / cloud.width) * RESTING_SCALE
  const percent = (px / REFERENCE_HEIGHT) * 100
  // The same size expressed against the reference *width*, so the horizontal
  // composition survives viewports taller than 1440x900. See above.
  const vw = (px / REFERENCE_WIDTH) * 100
  return `min(${percent.toFixed(3)}%, ${vw.toFixed(3)}vw)`
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One cloud cutout, as an AVIF/WebP/PNG `<picture>`.
 *
 * The cutouts are 224-430px wide and render at up to 1.15x, so they are already
 * at or past 1:1 on every screen — there is no width above the intrinsic one
 * worth delivering and no `srcset` here, only a format switch. The PNG stays as
 * the `<img src>` fallback.
 *
 * `display: contents` on the `<picture>` keeps it out of layout entirely, so
 * the `<img>` positions against the tile exactly as it did before the wrapper
 * existed.
 *
 * The clouds are pure decoration sitting over the campus illustration, which
 * carries the real description — `alt=""` plus `aria-hidden` keeps them out of
 * the accessibility tree twice over.
 */
function CloudImage({
  cloud,
  className,
  style,
}: {
  cloud: CloudSpec
  className: string
  style: CSSProperties
}) {
  const sources = cloudSources(cloud.file)
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={sources.avif} />
      <source type="image/webp" srcSet={sources.webp} />
      <img
        src={sources.png}
        alt=""
        aria-hidden="true"
        width={cloud.width}
        height={cloud.height}
        draggable={false}
        decoding="async"
        className={className}
        style={style}
      />
    </picture>
  )
}

/**
 * One stage-width tile of a layer's clouds. `SET_COUNT` of these, tile `k`
 * offset by `k` of its own widths, are what make the drift loop.
 */
function CloudSet({ layer, index }: { layer: CloudLayerSpec; index: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-[calc(100%/var(--cloud-sets))]"
      style={{ transform: `translateX(${index * 100}%)` }}
    >
      {layer.clouds.map((cloud) => (
        <CloudImage
          key={cloud.file}
          cloud={cloud}
          className="absolute h-auto max-w-none select-none"
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloudWidth(renderedWidth(layer, cloud)),
          }}
        />
      ))}
    </div>
  )
}

/**
 * The same clouds, arranged for the reduced-motion resting frame: smaller, and
 * pinned by their bottom edges into the sky band above the campus. Static — no
 * drift track, no scroll-linked wrapper, nothing to animate.
 */
function RestingCloudSet({ layer }: { layer: CloudLayerSpec }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {layer.clouds.map((cloud) => (
        <CloudImage
          key={cloud.file}
          cloud={cloud}
          className="absolute w-auto max-w-none select-none"
          style={{
            left: cloud.restingLeft,
            bottom: cloud.restingBottom,
            height: restingHeight(layer, cloud),
          }}
        />
      ))}
    </div>
  )
}

/**
 * The drift keyframes and timing, assembled outside JSX so the markup below
 * stays down to what it is rather than how long it takes.
 *
 * Note that moving it out here does *not* stop Tailwind's class scanner seeing
 * the word `transition` — the scanner reads source as loose text, so the object
 * key reads to it exactly like the prop did, and it emits a dead `.transition`
 * rule either way. That is dealt with by `@source not inline("transition")` in
 * src/index.css.
 *
 * `drifting` is the pause switch (P4-4). When it is false the track is animated
 * to the single value `LOOP_START` over zero seconds — the animation is gone,
 * not merely invisible: no keyframes, no `repeat`, nothing left running. The
 * snap costs nothing to look at because of *where* it is allowed to happen; see
 * `CloudLayer` below.
 */
function driftLoop(driftSeconds: number, drifting: boolean) {
  if (!drifting) {
    return {
      initial: { x: LOOP_START },
      animate: { x: LOOP_START },
      transition: { duration: 0 },
    }
  }
  return {
    initial: { x: LOOP_START },
    animate: { x: [LOOP_START, LOOP_END] },
    transition: {
      duration: driftSeconds,
      ease: 'linear' as const,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'loop' as const,
    },
  }
}

/**
 * One depth layer: a scroll-linked wrapper around a time-linked drift track.
 *
 * The wrapper is `inset-0`, so it is exactly the stage box — which means its
 * percentage `y` resolves against the stage height and `rise` can be read as
 * "percent of the viewport".
 */
function CloudLayer({ layer }: { layer: CloudLayerSpec }) {
  const { progress, reducedMotion } = useHeroScroll()

  /**
   * Does this layer's drift run? (P4-4 — WCAG 2.2.2 Pause, Stop, Hide.)
   *
   * The drift is time-linked and infinite, so left alone it keeps animating
   * forever — including long after the scroll-linked fade below has taken the
   * layer to `opacity: 0`, i.e. after it has stopped being anything a reader
   * could see. Past `layer.fadeEnd` the animation is pure cost: frames, battery
   * and a compositor layer, for nothing on screen.
   *
   * So the threshold is exactly this layer's own `fadeEnd`, and that choice is
   * what makes the switch invisible. At `fadeEnd` the layer's opacity is
   * *exactly* zero by the same arithmetic that drives the fade, so both the
   * stop and the restart — which snaps the track back to `LOOP_START` — happen
   * on a frame that paints nothing. A single shared threshold would have paused
   * the near layer while it was still faintly visible; per-layer, it cannot.
   *
   * Scrolling back up past `fadeEnd` sets this true again and the drift
   * resumes, so the pause is a state of the page rather than a one-way latch.
   *
   * The subscription is motion's own `useMotionValueEvent` on the hero's single
   * `useScroll` progress value — there is still no `scroll` listener in `src/`.
   * The handler runs per frame while scrolling but calls `setDrifting` with a
   * boolean that changes at most twice per traversal, and React bails out of a
   * re-render when the state is identical, so a scroll costs one render at the
   * crossing and none either side of it.
   *
   * What this does *not* claim: it is not an in-page pause control, and 2.2.2's
   * strictest reading wants one. The page's answer to that is
   * `prefers-reduced-motion` (below), which removes the drift entirely; this
   * bounds the animation so it stops on its own instead of running for the rest
   * of the session behind content the reader has already scrolled to.
   *
   * The same flag also gates this layer's `will-change` below (P5-7): past
   * `fadeEnd` neither the drift nor the scroll-linked `y`/`opacity` moves, so
   * the hint has nothing left to buy. `fadeEnd` is the right threshold for both
   * for the same reason — the layer's opacity is exactly 0 there, so the
   * de-promotion, like the pause, lands on a frame that paints nothing.
   */
  const [drifting, setDrifting] = useState(
    () => progress.get() <= layer.fadeEnd,
  )
  useMotionValueEvent(progress, 'change', (p) => {
    setDrifting(p <= layer.fadeEnd)
  })

  /**
   * Scroll-linked fade. Every layer is at zero by 0.30 of the track, and the
   * pan does not finish until 0.75, so the revealed campus is never sitting
   * under a cloud. The layers are staggered — near clears first, far last —
   * which is the same parallax cue the drift speeds give, read vertically.
   *
   * `opacity` and `y` are built above the `reducedMotion` early return because
   * the Rules of Hooks require it, and the resting branch below reads neither
   * (P2-7). That is the only legal shape for one component: the alternative is
   * splitting `CloudLayer` in two so the moving branch is its own component,
   * which trades a live subscription for a second component and an extra layer
   * of indirection. Left as is deliberately.
   */
  const opacity = useTransform(
    progress,
    (p) => layer.opacity * (1 - rangeProgress(p, layer.fadeStart, layer.fadeEnd)),
  )

  /** Scroll-linked lift, over the whole fade. Nearer layers travel further. */
  const y = useTransform(
    progress,
    (p) => `${-layer.rise * rangeProgress(p, 0, layer.fadeEnd)}%`,
  )

  if (reducedMotion) {
    // The resting composition: clouds rendered at their layer opacity, still
    // and complete, sitting in the sky above the campus the pan has already
    // finished revealing. No time-linked and no scroll-linked movement at all.
    return (
      <div
        data-cloud-layer={layer.id}
        className="absolute inset-0"
        style={{ opacity: layer.opacity }}
      >
        <RestingCloudSet layer={layer} />
      </div>
    )
  }

  return (
    <m.div
      data-cloud-layer={layer.id}
      // Promoted only while `y`/`opacity` are still moving — see `drifting`
      // above (P5-7). The drift child below keeps its hint unconditionally,
      // even once `drifting` is false and `driftLoop` has frozen it at
      // `LOOP_START` (P4-4): the promotion is retained so that scrolling back
      // up resumes the drift without re-promoting a 5700px-wide track, at the
      // measured cost of one retained, non-drawing (opacity 0) compositor
      // layer per cloud layer — see the P5-7 entry in audit/08-fix-log.md.
      className={`absolute inset-0${drifting ? ' will-change-transform' : ''}`}
      style={{ opacity, y }}
    >
      <m.div
        data-cloud-drift
        className="absolute inset-y-0 left-0 w-[calc(100%*var(--cloud-sets))] will-change-transform"
        {...driftLoop(layer.driftSeconds, drifting)}
      >
        {Array.from({ length: SET_COUNT }, (_, index) => (
          <CloudSet key={index} layer={layer} index={index} />
        ))}
      </m.div>
    </m.div>
  )
}

/**
 * The hero's `data-hero-clouds` layer. Renders far -> mid -> near, so nearer
 * clouds paint over more distant ones.
 */
export function HeroClouds() {
  return (
    <div
      data-hero-clouds
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      // `SET_COUNT` is derived, so it cannot be a literal Tailwind class. It
      // rides down as a custom property from this element — which never
      // animates — so the drift track and its tiles get their static widths
      // from the stylesheet and nothing but `transform` is ever written inline
      // on an animated element.
      //
      // The assertion is P2-6 and has no non-assertion spelling: React's
      // `CSSProperties` has no index signature for `--*` keys. It is safe as
      // written — react-dom routes custom properties through
      // `style.setProperty()` verbatim, so the number lands as `4`, not `4px`,
      // and the `calc()`s that read it stay valid.
      style={{ '--cloud-sets': SET_COUNT } as CSSProperties}
    >
      {CLOUD_LAYERS.map((layer) => (
        <CloudLayer key={layer.id} layer={layer} />
      ))}
    </div>
  )
}
