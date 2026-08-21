import { motion, useTransform } from 'motion/react'
import { rangeProgress, useHeroScroll } from '../lib/motion'

/**
 * Phase 4 — the hero's drifting cloud parallax.
 *
 * This component *is* the `data-hero-clouds` layer of the hero stage: it mounts
 * between the campus artwork and the legibility scrim (see Hero.tsx for the
 * layer contract) and renders three depth layers of cloud cutouts over the sky.
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
 *       [CloudSet] x2    the duplicated contents that make the drift seamless.
 *
 * Only `transform` and `opacity` are ever animated. There is no scroll event
 * listener anywhere — the scroll-linked half reads `useHeroScroll()`, which is
 * fed by the single `useScroll` subscription <Hero> already owns.
 */

/* -------------------------------------------------------------------------- */
/* The seamless loop                                                          */
/* -------------------------------------------------------------------------- */

/**
 * How the horizontal loop is built, and why it cannot seam.
 *
 * Each layer's drift track is `w-[200%]` — exactly twice the stage width, `W`.
 * It holds two identical `CloudSet`s, each `w-1/2` of the track (= `W`). The
 * first sits at the track origin; the second is offset by `translate-x-full`,
 * i.e. 100% of *its own* width, = `W`. So set B's copy of any cloud sits
 * exactly `W` to the right of set A's copy of that cloud.
 *
 * The track animates `x` from `0%` to `-50%`. A percentage translate resolves
 * against the element's own border box, so `-50%` of a `2W`-wide track is
 * exactly `-W` — one full stage width, and exactly the offset between the two
 * sets. At the end of every cycle set B has therefore landed precisely where
 * set A stood at the start, and the frame is pixel-identical to frame zero.
 * The keyframe jump back to `0%` swaps two identical frames.
 *
 * The arithmetic is exact rather than merely close: `W` is a layout value, the
 * track's used width is `2W` (exactly representable, no rounding), and half of
 * that is `W` again. The two sets are laid out from the same `w-1/2`
 * computation, so they cannot disagree by even a subpixel.
 *
 * Easing is `linear`, so velocity is constant across the wrap too — no
 * ease-out/ease-in stutter at the seam. Clouds that hang off a set's edge
 * (negative `left`, or `left` + width past 100%) overlap into the neighbouring
 * set's territory; that is fine and in fact required, because the same overlap
 * exists at both ends of the cycle.
 */
const LOOP_START = '0%'
const LOOP_END = '-50%'

/* -------------------------------------------------------------------------- */
/* Sizing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The width the clouds are tuned against. Every `left` below is a percentage of
 * the stage width, so composition is resolution-independent, but the cloud
 * *sizes* are absolute — a cloud is a fixed-size object, not a fraction of the
 * window.
 */
const REFERENCE_WIDTH = 1440

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

function cloudWidth(renderedPx: number): string {
  const vw = (renderedPx / REFERENCE_WIDTH) * 100 * SHRINK_BELOW
  return `min(${renderedPx}px, ${vw.toFixed(2)}vw)`
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
}

type CloudLayerSpec = {
  id: string
  /** Multiplier on each cutout's intrinsic width. far < mid < near. */
  scale: number
  /** Resting opacity of the whole layer. far < mid < near. */
  opacity: number
  /** Seconds for one full loop — one stage width of travel. near < mid < far. */
  driftSeconds: number
  /** How far the layer lifts (as a % of stage height) while it fades out. */
  rise: number
  /** Raw hero-track progress over which the layer fades to nothing. */
  fadeStart: number
  fadeEnd: number
  clouds: CloudSpec[]
}

/**
 * Three depth layers, distinct in all four parameters the brief calls out.
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
    driftSeconds: 88,
    rise: 10,
    fadeStart: 0.04,
    fadeEnd: 0.3,
    clouds: [
      { file: 'cloud-6.png', width: 224, height: 70, left: '13%', top: '26%' },
      { file: 'cloud-4.png', width: 266, height: 108, left: '51%', top: '14%' },
    ],
  },
  {
    id: 'mid',
    scale: 0.8,
    opacity: 0.75,
    driftSeconds: 74,
    rise: 16,
    fadeStart: 0.02,
    fadeEnd: 0.26,
    clouds: [
      { file: 'cloud-2.png', width: 430, height: 194, left: '25%', top: '9%' },
      { file: 'cloud-3.png', width: 263, height: 229, left: '61%', top: '23%' },
    ],
  },
  {
    id: 'near',
    scale: 1.15,
    opacity: 1,
    driftSeconds: 62,
    rise: 24,
    fadeStart: 0.01,
    fadeEnd: 0.22,
    /**
     * Both near clouds are deliberately hung off a viewport edge, so the layer
     * reads as passing in front of the camera rather than as a tidy vignette.
     * At 1440px: cloud-5 renders 394px wide at left -115px (115px clipped by
     * the left edge) and cloud-1 renders 493px wide at left 1094px, running to
     * 1587px — 147px past the right edge.
     */
    clouds: [
      { file: 'cloud-5.png', width: 343, height: 253, left: '-8%', top: '2%' },
      { file: 'cloud-1.png', width: 429, height: 259, left: '76%', top: '0%' },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One stage-width tile of a layer's clouds. Two of these, the second offset by
 * its own full width, are what make the drift loop.
 *
 * The images are pure decoration over an illustration that is itself
 * `aria-hidden` — `alt=""` plus `aria-hidden` keeps them out of the tree twice
 * over.
 */
function CloudSet({
  layer,
  offset = false,
}: {
  layer: CloudLayerSpec
  offset?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-y-0 left-0 w-1/2 ${offset ? 'translate-x-full' : ''}`}
    >
      {layer.clouds.map((cloud) => (
        <img
          key={cloud.file}
          src={`/artwork/clouds/${cloud.file}`}
          alt=""
          aria-hidden="true"
          width={cloud.width}
          height={cloud.height}
          draggable={false}
          decoding="async"
          className="absolute h-auto max-w-none select-none"
          style={{
            left: cloud.left,
            top: cloud.top,
            width: cloudWidth(Math.round(cloud.width * layer.scale)),
          }}
        />
      ))}
    </div>
  )
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
    // Resting composition: the frame the animation starts and ends on, with no
    // time-linked and no scroll-linked movement at all. Only the first set is
    // mounted — the second lives entirely off the right edge at rest, so it
    // would contribute nothing but bytes.
    return (
      <div
        data-cloud-layer={layer.id}
        className="absolute inset-0"
        style={{ opacity: layer.opacity }}
      >
        <div className="absolute inset-y-0 left-0 w-[200%]">
          <CloudSet layer={layer} />
        </div>
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
        className="absolute inset-y-0 left-0 w-[200%] will-change-transform"
        initial={{ x: LOOP_START }}
        animate={{ x: [LOOP_START, LOOP_END] }}
        transition={{
          duration: layer.driftSeconds,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        <CloudSet layer={layer} />
        <CloudSet layer={layer} offset />
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
    >
      {CLOUD_LAYERS.map((layer) => (
        <CloudLayer key={layer.id} layer={layer} />
      ))}
    </div>
  )
}
