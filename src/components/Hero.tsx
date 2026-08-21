import { useMemo, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { Container } from './Layout'
import { ButtonLink } from './ButtonLink'
import { HeroClouds } from './HeroClouds'
import { DISCORD_URL } from '../lib/links'
import {
  HERO_PAN_EASE,
  HeroScrollContext,
  rangeProgress,
  usePrefersReducedMotion,
  type HeroScroll,
} from '../lib/motion'

/**
 * The hero: a scroll-driven pan down the campus illustration.
 *
 * Layer contract (unchanged from Phase 2, now animated):
 *
 *   <section data-hero>            the scroll TRACK. Taller than the viewport
 *                                  purely to buy scroll distance for the pan.
 *     <div data-hero-stage>        sticky top-0, exactly one viewport tall.
 *       <div data-hero-artwork>    Campus.png — scaled up and panned down.
 *       <div data-hero-clouds>     Phase 4: cloud-1..6 parallax layers.
 *       <div data-hero-scrim>      contrast gradient, fades out with the copy.
 *       <div data-hero-copy>       headline + CTA, fades out before the reveal.
 *
 * Everything inside the stage is wrapped in a HeroScrollContext, so Phase 4's
 * cloud layers can read the same progress values instead of opening a second
 * scroll subscription. See src/lib/motion.ts.
 *
 * Copy below is still Phase 2 placeholder wording; Phase 5 replaces it.
 */

const CAMPUS_SRC = '/artwork/campus/Campus.png'
const CAMPUS_WIDTH = 1672
const CAMPUS_HEIGHT = 941

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Starting scale of the illustration.
 *
 * The image is rendered `object-cover` into a stage exactly one viewport tall.
 * At every viewport narrower than the artwork's 16:9 (1440x900 and 390x844
 * both qualify) cover is height-constrained, so the whole image height fits at
 * scale 1 and **the fraction of image height visible at scale S is 1/S**.
 *
 * Measured against the source file, the first rooftops of the dormitory
 * complex begin at row 330 of 941 = 0.351 of the image height. (Verified by
 * scanning the PNG for brick-red pixels: rows above 330 return only single
 * digit counts — bare winter branches — then the count jumps to 11 at row 330
 * and climbs past 100 within ten rows.)
 *
 * S = 3 shows the top 1/3 = 0.333, i.e. down to row 313.6 — sky, clouds, the
 * ridgeline and the treeline, with 16 source pixels (~47 rendered pixels at
 * this scale on a 900px-tall viewport) of clearance before the first roof.
 * That is the value the plan suggested and measurement confirms it, so it
 * stands. The plan's own arithmetic note is the binding one: 1/S must be
 * below 0.35, so S must exceed 2.86 — 2.4 would have shown buildings.
 *
 * Upscaling a 1672px-wide source 3x is visibly soft at progress 0 and sharpens
 * as it descends to 1x. Accepted; image delivery is Phase 6's problem.
 */
const PAN_START_SCALE = 3

/**
 * Total height of the scroll track. The sticky stage is one viewport tall, so
 * the stage stays pinned for `260 - 100 = 160dvh` of scrolling.
 */
const TRACK_HEIGHT = 'h-[260dvh]'

/**
 * Fraction of the pinned scroll the pan itself consumes. The pan finishes at
 * 0.75 (= 120dvh of scrolling) and the remaining 0.25 (= 40dvh) is a hold on
 * the finished frame before the stage unpins and the hero scrolls away.
 */
const PAN_SCROLL_FRACTION = 0.75

/** The hero copy fades out over this window of raw track progress. */
const COPY_FADE_START = 0.04
const COPY_FADE_END = 0.26

/** How far the copy drifts up (px) as it goes. Transform only. */
const COPY_DRIFT = -24

/**
 * translateY, as a fraction of the stage height, that keeps the *top edge* of
 * the illustration pinned to the top of the viewport at a given scale.
 *
 * With `transform-origin: center` the emitted transform is
 * `translateY(t·H) scale(S)`, so image height-fraction `f` lands at screen
 * `H/2 + H·S·(f - 0.5) + t·H`. Setting that to 0 for `f = 0` gives
 * `t = (S - 1) / 2`.
 *
 * Deriving y *from* scale rather than interpolating the two independently is
 * deliberate: it makes it impossible for them to drift out of step and letter-
 * box the stage mid-pan. It also means the top edge stays pinned throughout,
 * which is the only monotonic path between "top third only" and "whole image"
 * — anything else would tilt the camera down and then back up again.
 */
function topPinnedTranslate(scale: number): string {
  return `${((scale - 1) / 2) * 100}%`
}

export function Hero() {
  const trackRef = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // The page's only scroll subscription, and it is motion's, not ours — no
  // hand-rolled `addEventListener('scroll', ...)` anywhere in src/. Everything
  // downstream (and everything Phase 4 adds) derives from this one value.
  const { scrollYProgress: progress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  /**
   * Eased pan progress. Under reduced motion this is pinned to 1 — the resting
   * state — so the illustration renders statically at scale 1 with no
   * scroll-linked movement at all.
   */
  const pan = useTransform(progress, (p) =>
    reducedMotion ? 1 : HERO_PAN_EASE(rangeProgress(p, 0, PAN_SCROLL_FRACTION)),
  )

  const scale = useTransform(
    pan,
    (p) => PAN_START_SCALE + (1 - PAN_START_SCALE) * p,
  )
  const y = useTransform(scale, topPinnedTranslate)

  /**
   * The copy is gone by 0.26 of the track, long before the pan completes at
   * 0.75 — the finished campus view is never sitting behind body text.
   */
  const copyOpacity = useTransform(progress, (p) =>
    reducedMotion ? 1 : 1 - rangeProgress(p, COPY_FADE_START, COPY_FADE_END),
  )
  const copyY = useTransform(copyOpacity, (o) => (1 - o) * COPY_DRIFT)

  // Faded-out copy must not stay focusable, or the Discord CTA becomes an
  // invisible tab stop over the illustration. `inert` is a discrete attribute
  // toggle at a threshold, not an animated property.
  const [copyHidden, setCopyHidden] = useState(false)
  useMotionValueEvent(copyOpacity, 'change', (value) => {
    const hidden = value <= 0.01
    setCopyHidden((wasHidden) => (wasHidden === hidden ? wasHidden : hidden))
  })

  const heroScroll = useMemo<HeroScroll>(
    () => ({ progress, pan, reducedMotion }),
    [progress, pan, reducedMotion],
  )

  return (
    <section
      id="top"
      data-hero
      ref={trackRef}
      aria-labelledby="hero-title"
      // No `overflow-hidden` here: an overflow-clipped ancestor becomes the
      // sticky element's scrollport and the stage would never pin. The stage
      // clips the scaled artwork itself.
      className={`bg-sky relative w-full ${reducedMotion ? 'h-dvh' : TRACK_HEIGHT}`}
    >
      <HeroScrollContext value={heroScroll}>
        <div
          data-hero-stage
          className="sticky top-0 h-dvh w-full overflow-hidden"
        >
          <div
            data-hero-artwork
            aria-hidden="true"
            className="absolute inset-0"
          >
            <motion.img
              src={CAMPUS_SRC}
              alt=""
              width={CAMPUS_WIDTH}
              height={CAMPUS_HEIGHT}
              draggable={false}
              decoding="async"
              fetchPriority="high"
              className={`h-full w-full origin-center object-cover object-center select-none ${
                reducedMotion ? '' : 'will-change-transform'
              }`}
              style={{ scale, y }}
            />
          </div>

          {/* Phase 4: the drifting cloud parallax. <HeroClouds> renders the
              `data-hero-clouds` layer itself and reads useHeroScroll() from the
              context above rather than opening its own subscription. */}
          <HeroClouds />

          {/*
           * Legibility scrim. cloud-on-sky is only ~2.9:1 unaided; this bottom
           * gradient lifts the hero copy past 4.5:1. It fades on the same
           * value as the copy, so it stops tinting the illustration the moment
           * there is no text left to protect.
           */}
          <motion.div
            data-hero-scrim
            aria-hidden="true"
            className="from-pine/60 via-pine/25 pointer-events-none absolute inset-0 bg-linear-to-t via-45% to-transparent"
            style={{ opacity: copyOpacity }}
          />

          <motion.div
            data-hero-copy
            inert={copyHidden}
            className="relative z-10 flex h-full flex-col justify-end pt-16 pb-14 sm:pt-20 sm:pb-20"
            style={{ opacity: copyOpacity, y: copyY }}
          >
            <Container>
              <div className="max-w-3xl">
                <p className="text-eyebrow text-cloud font-medium uppercase">
                  Binghamton University
                </p>
                <h1
                  id="hero-title"
                  className="font-display text-display-xl text-cloud mt-5 font-semibold text-balance"
                >
                  A headline about learning to build things goes here.
                </h1>
                <p className="text-lede text-cloud mt-6 max-w-xl">
                  One placeholder sentence saying HackBU is open to everyone, no
                  programming experience required.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <ButtonLink href={DISCORD_URL} size="lg">
                    Join the Discord
                  </ButtonLink>
                  <p className="text-caption text-cloud">
                    Free, open to all majors.
                  </p>
                </div>
              </div>
            </Container>
          </motion.div>
        </div>
      </HeroScrollContext>
    </section>
  )
}
