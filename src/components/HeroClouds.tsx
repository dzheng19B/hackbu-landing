import type { CSSProperties } from 'react'
import { motion, useTransform } from 'motion/react'
import { cloudSources } from '../lib/images'
import { rangeProgress, useHeroScroll } from '../lib/motion'

/**
 * Phase 4 — the hero's drifting cloud parallax.
 *
 * This component *is* the `data-hero-clouds` layer of the hero stage: it mounts
 * over the campus artwork and is the topmost layer of it (see Hero.tsx for the
 * layer contract), rendering three depth layers of cloud cutouts over the sky.
 * There is nothing above it — the pine legibility scrim that used to sit there
 * went when Phase 7 moved the hero copy out.
 *
 * Two independent motions compose here, and they are deliberately kept on
 * separate elements so they never fight over one transform:
 *
 *   [data-cloud-layer]   scroll-linked. translateY + opacity, driven by the
 *                        hero's scroll progress. This is the layer that lifts
 *                        the clouds out of frame and fades them before the pan
 *                        uncovers the campus.
 *     [data-cloud-drift] time-linked. translateX only, linear and infinite.
 *                        This is the endless horizontal drift.
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
 * Three depth layers — kept at three on every viewport. Phase 6 asked whether
 * small screens should drop one, and the measurement says no.
 *
 * At 390x844 the stage clips all but 8 of the 24 mounted `<img>` nodes, so the
 * other 16 cost layout, not paint. The 8 that do paint cover 32.66% of the
 * stage between them, and that total is very unevenly split:
 *
 *     near  23.28% of the stage   (cloud-1 + cloud-5, the two large cutouts)
 *     mid    8.18%
 *     far    1.19%
 *
 * The layer a reduction would take is `far` — smallest, most distant, least
 * missed — and it is worth 1.19% of one viewport of alpha blending. Dropping it
 * cannot buy a frame; dropping `near` might, but `near` is the parallax. So the
 * count stands at every width.
 *
 * (Frame rate itself was not measurable in the verification browser — it runs
 * with `document.hidden`, so `requestAnimationFrame` never fires and motion's
 * loop is frozen. This is a fill-rate and node-count argument, not a profile.)
 *
 * Three depth layers, distinct in all four parameters the brief calls out.
 * `scale`, `opacity` and speed all rise together toward the viewer, and speed
 * is derived from `scale` rather than picked — see `driftSeconds` above.
 *
 * The cutouts are cast by shape, not just size: cloud-6 (3.2:1) and cloud-4
 * (2.5:1) are flat wisps, which is what distant cloud reads as; cloud-1 and
 * cloud-5 are tall, detailed cumulus towers, which is what a near cloud reads
 * as. cloud-2 and cloud-3 sit between the two and take the middle layer.
 *
 * Vertical placement keeps every cloud inside the sky band. At the pan's
 * starting scale of 3 the stage shows the top third of the illustration
 * (source rows 0..~314), and the hills break the horizon around source row
 * 190 — about 60% of the stage height. The lowest cloud edge here bottoms out
 * near 44%, so the layers sit over sky, never over the ridgeline.
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
        left: '13%',
        top: '26%',
        restingLeft: '88%',
        restingBottom: '87%',
      },
      {
        file: 'cloud-4.png',
        width: 266,
        height: 108,
        left: '51%',
        top: '14%',
        restingLeft: '62%',
        restingBottom: '88%',
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
        file: 'cloud-2.png',
        width: 430,
        height: 194,
        left: '25%',
        top: '9%',
        restingLeft: '26%',
        restingBottom: '84.5%',
      },
      {
        file: 'cloud-3.png',
        width: 263,
        height: 229,
        left: '61%',
        top: '23%',
        restingLeft: '72%',
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
     * Both near clouds are deliberately hung off a viewport edge, so the layer
     * reads as passing in front of the camera rather than as a tidy vignette.
     * At 1440px: cloud-5 renders 394px wide at left -115.2px (115.2px clipped
     * by the left edge) and cloud-1 renders 493px wide at left 1094.4px,
     * running to 1587.4px — 147.4px past the right edge.
     *
     * That overhang is exactly why the drift track needs more than two tiles;
     * see `TILE_OVERHANG` below.
     */
    clouds: [
      {
        file: 'cloud-5.png',
        width: 343,
        height: 253,
        left: '-8%',
        top: '2%',
        restingLeft: '5%',
        restingBottom: '82%',
      },
      {
        file: 'cloud-1.png',
        width: 429,
        height: 259,
        left: '76%',
        top: '0%',
        restingLeft: '45%',
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
 * right 0.4447 (cloud-1, `left: 76%` + `68.47vw`). Every other cloud is 0 on
 * both sides — far and mid already wrapped cleanly.
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
 * tile at `+2W` to supply cloud-5's head; neither existed, so a 115.2 x 291px
 * slice of cloud-5 popped in at the right edge and a 147.4 x 298px slice of
 * cloud-1 popped out at the left edge, once every near-layer loop.
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
 * With the specs above `oR = 0.4447` and `oL = 0.08`, so `LEAD_SETS = 1` and
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
 *    camera: `RESTING_SCALE = 1/3`. The sky band is only about 92px tall at
 *    1440x900 once the header has taken its bite, so at full size the near
 *    clouds — 291px and 298px — could not sit in it at all.
 * 2. **Position.** Each cloud is pinned by its *bottom* edge to a percentage of
 *    the stage height, so the edge that matters — the low one — is placed
 *    directly rather than inferred from a `top` plus a height.
 *
 * Where the band is, measured off Campus.png (1672 x 941) rather than guessed:
 * the first pixel darker than luma 105 — the hill/tree silhouette breaking the
 * horizon — is at source row 181, i.e. **0.1923** of the image height, and the
 * first brick-coloured pixel of the dormitories is at row 240 (**0.2550**),
 * with the roofs proper from row 291 (0.3092). At scale 1 the illustration is
 * `object-cover` into a stage that is narrower than its 16:9, so it is
 * height-constrained and image-height fraction `f` lands at stage `f·H`. Every
 * `restingBottom` above is therefore >= 82% (bottom edge at or above 0.18·H),
 * clearing the ridgeline by at least 1.2% of the stage height and the first
 * brick by 7.5%.
 *
 * The sizes are given as a percentage of the *stage height* rather than in px,
 * so that clearance is a ratio and holds at every viewport rather than only at
 * the reference one.
 *
 * The fixed site header is an opaque `bg-cloud` bar 81px tall (`h-20` + a 1px
 * border; 65px below `sm`) across the top of the stage. The layers are stacked
 * so the small far clouds sit clear of it and the two tall near clouds tuck
 * their tops a little way behind it — at 1440x900 the least-visible cloud,
 * cloud-1, still shows 72px of its 99px height below the header.
 *
 * (This was written assuming a stage narrower than the artwork's 16:9, and
 * noted that a wider viewport ate the sky band from both ends. Phase 6 fixed
 * that in the pan: the illustration is now pinned by its top edge at every
 * aspect, so at 2545x1080 the resting frame shows image rows 0..0.754 and the
 * ridgeline lands at 25.5% of the stage height instead of 9.2%. Every
 * `restingBottom` above puts its cloud's lower edge in the top 18%, so the
 * clearance over the ridgeline is now larger at ultrawide than it was at 16:9,
 * not smaller.)
 */
const RESTING_SCALE = 1 / 3

function restingHeight(layer: CloudLayerSpec, cloud: CloudSpec): string {
  const px =
    renderedWidth(layer, cloud) * (cloud.height / cloud.width) * RESTING_SCALE
  return `${((px / REFERENCE_HEIGHT) * 100).toFixed(3)}%`
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
 */
function driftLoop(driftSeconds: number) {
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
   * Scroll-linked fade. Every layer is at zero by 0.30 of the track, and the
   * pan does not finish until 0.75, so the revealed campus is never sitting
   * under a cloud. The layers are staggered — near clears first, far last —
   * which is the same parallax cue the drift speeds give, read vertically.
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
    <motion.div
      data-cloud-layer={layer.id}
      className="absolute inset-0 will-change-transform"
      style={{ opacity, y }}
    >
      <motion.div
        data-cloud-drift
        className="absolute inset-y-0 left-0 w-[calc(100%*var(--cloud-sets))] will-change-transform"
        {...driftLoop(layer.driftSeconds)}
      >
        {Array.from({ length: SET_COUNT }, (_, index) => (
          <CloudSet key={index} layer={layer} index={index} />
        ))}
      </motion.div>
    </motion.div>
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
      style={{ '--cloud-sets': SET_COUNT } as CSSProperties}
    >
      {CLOUD_LAYERS.map((layer) => (
        <CloudLayer key={layer.id} layer={layer} />
      ))}
    </div>
  )
}
