import { useMemo, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { Container } from './Layout'
import { ButtonLink } from './ButtonLink'
import { HeroClouds } from './HeroClouds'
import { DISCORD_URL } from '../lib/links'
import {
  CAMPUS_ALT,
  CAMPUS_HEIGHT,
  CAMPUS_PNG,
  CAMPUS_SIZES,
  CAMPUS_SRCSET,
  CAMPUS_WIDTH,
} from '../lib/images'
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
 *       <div data-hero-artwork>    the campus illustration, as a <picture> —
 *                                  scaled up and panned down.
 *       <div data-hero-clouds>     Phase 4: cloud-1..6 parallax layers.
 *       <div data-hero-copy>       headline + CTA, fades out before the reveal.
 *         <div data-hero-scrim>            the contrast wash behind the copy,
 *         <div data-hero-scrim-feather>    and its soft upper edge. Phase 6
 *                                  moved both inside the copy layer so they are
 *                                  bounded to the text and inherit its fade.
 *
 * Everything inside the stage is wrapped in a HeroScrollContext, so Phase 4's
 * cloud layers can read the same progress values instead of opening a second
 * scroll subscription. See src/lib/motion.ts.
 */

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Starting scale of the illustration.
 *
 * The image is rendered `object-cover` into a stage exactly one viewport tall,
 * with its top edge pinned to the top of the stage (see `object-[52%_0%]` and
 * `origin-top` below). Writing `f1` for the fraction of the image's height that
 * `object-cover` leaves visible at scale 1, **the visible band at scale S runs
 * from 0 to f1/S**, and
 *
 *     viewport aspect <= 1672/941   ->  f1 = 1        (cover is height-bound)
 *     viewport aspect >  1672/941   ->  f1 = aspect_image / aspect_viewport
 *
 * Measured against the source file, the first rooftops of the dormitory
 * complex begin at row 330 of 941 = 0.351 of the image height. (Verified by
 * scanning the PNG for brick-red pixels: rows above 330 return only single
 * digit counts — bare winter branches — then the count jumps to 11 at row 330
 * and climbs past 100 within ten rows.)
 *
 * `f1` never exceeds 1, so `f1/S <= 1/S` and S = 3 shows at most the top
 * 1/3 = 0.333 of the image at *every* aspect ratio — sky, clouds, the ridgeline
 * and the treeline, with 16 source pixels of clearance before the first roof.
 * The binding constraint is 1/S < 0.351, i.e. S > 2.85; 2.4 would have shown
 * buildings, so this scale is held at every breakpoint rather than reduced in
 * portrait. It does not need to be: `f1 = 1` in portrait exactly as in
 * landscape, because both are narrower than the artwork.
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
 * How the illustration's top edge stays pinned — and why the previous scheme
 * did not.
 *
 * Phase 3 used `object-position: center` + `transform-origin: center` and paid
 * for the pin with a derived `translateY((S-1)/2 x 100%)`. Writing `C` for the
 * drawn content height and `H` for the stage height, that puts the content's
 * top edge at screen `S(H - C)/2`. On any viewport narrower than the artwork's
 * 16:9, cover is height-constrained, `C = H`, and the expression is 0 — pinned.
 * On a viewport *wider* than 16:9 cover flips to width-constrained, `C > H`,
 * and the top edge sits above the stage: the visible band at scale 3 becomes
 * `(1-f1)/2 .. (1-f1)/2 + f1/3`, which at 1400x600 measured 0.115..0.372 —
 * past the 0.351 roofline, so rooftops were visible at scroll 0.
 *
 * The fix is to stop compensating and move the two reference points instead:
 *
 *   object-position `52% 0%`   the drawn content's top edge sits on the stage's
 *                              top edge before any transform, at every aspect
 *   transform-origin `top`     scaling then grows downward from that edge
 *
 * so the top edge maps to screen 0 for all S, with no translate at all. The
 * visible band is `0 .. f1/S` everywhere, which starts at 0 rather than at
 * `(1-f1)/2` and is what makes the no-buildings criterion aspect-independent.
 * `translateY` is gone; scale alone drives the pan.
 *
 * The horizontal `52%` is the focal crop: the Library Tower is centred at 0.52
 * of the image width, and on a 390px-wide viewport cover discards ~74% of the
 * image width, so `center` would leave the tower 30px right of centre. It is
 * applied at every width — above `sm` the horizontal crop is small enough that
 * the 2% shift is invisible, and one value is one thing to reason about.
 *
 * (`origin-top` is `50% 0%`, so the horizontal half of the scale still grows
 * about the stage's centre and the tower stays centred through the whole pan.)
 *
 * The trade this accepts: above 16:9 the pan's end state now shows the top
 * `f1` of the image rather than the middle `f1`. Cover has to crop something at
 * those aspects either way; cropping only the foreground snow, and keeping an
 * exact top pin at every aspect with no viewport measurement, is the better
 * half of that trade. Below 16:9 — 1440x900 and 390x844 included — nothing
 * changes: `f1 = 1`, the band is `0..1/S`, and the pan still ends on the whole
 * illustration at scale 1.
 */
const CAMPUS_OBJECT_POSITION = 'object-[52%_0%]'

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
          <div data-hero-artwork className="absolute inset-0">
            {/*
             * `display: contents` so the <picture> adds no box of its own and
             * the <img>'s `h-full` still resolves against the stage-sized div
             * above it. AVIF first, WebP second, the original PNG as the
             * `<img src>` a browser only reaches if it understands neither.
             */}
            <picture className="contents">
              <source
                type="image/avif"
                srcSet={CAMPUS_SRCSET.avif}
                sizes={CAMPUS_SIZES}
              />
              <source
                type="image/webp"
                srcSet={CAMPUS_SRCSET.webp}
                sizes={CAMPUS_SIZES}
              />
              <motion.img
                src={CAMPUS_PNG}
                alt={CAMPUS_ALT}
                width={CAMPUS_WIDTH}
                height={CAMPUS_HEIGHT}
                draggable={false}
                decoding="async"
                fetchPriority="high"
                className={`h-full w-full origin-top ${CAMPUS_OBJECT_POSITION} object-cover select-none ${
                  reducedMotion ? '' : 'will-change-transform'
                }`}
                style={{ scale }}
              />
            </picture>
          </div>

          {/* Phase 4: the drifting cloud parallax. <HeroClouds> renders the
              `data-hero-clouds` layer itself and reads useHeroScroll() from the
              context above rather than opening its own subscription. */}
          <HeroClouds />

          <motion.div
            data-hero-copy
            inert={copyHidden}
            className="relative z-10 flex h-full flex-col justify-end"
            style={{ opacity: copyOpacity, y: copyY }}
          >
            <div className="relative pt-16 pb-14 sm:pt-20 sm:pb-20">
              {/*
               * Legibility scrim (rebuilt in Phase 6 — see the note below).
               *
               * Phase 3 shipped this as a stage-height gradient running
               * pine/60 -> pine/25 -> transparent, on the claim that it lifted
               * the copy past 4.5:1. Measured, it does not: sampling the actual
               * illustration behind each line at scroll 0 and compositing the
               * gradient over it gives 1.43:1 for the headline and 1.80:1 for
               * the lede, because at scale 3 the copy sits over sky and painted
               * cloud — the brightest pixels in the artwork reach luma 0.98 —
               * while the gradient is only ~0.2-0.4 opaque that far up.
               *
               * cloud (#F7F5EE) over an arbitrary painterly backdrop needs a
               * pine wash of **alpha 0.836** to clear 4.5:1 in the worst case
               * (solved against a pure white backdrop, which bounds every pixel
               * in the artwork). There is no lighter treatment that passes:
               * inverting to pine-on-cloud needs the same alpha in the other
               * direction. So the scrim has to be near-opaque where the text is
               * — the only real choice is *where*.
               *
               * It is therefore no longer stage-height. A stage-height gradient
               * cannot work: the copy occupies 56% of the stage at 1440x900,
               * 62% at 390x844 and 86% at 800x500, so no fixed stop covers the
               * text at every viewport without washing the whole frame. Instead
               * the scrim is bounded to the copy's own box — full-bleed across,
               * exactly as tall as the copy plus its padding — so it covers the
               * text by construction at every viewport, and a fixed 144px
               * feather above it fades the edge out over a constant distance
               * rather than a percentage.
               *
               * Both halves are plain children of the copy layer now, so they
               * inherit its opacity and drift instead of re-deriving them —
               * one less animated element, and the scrim can no longer fall out
               * of step with the text it exists to protect.
               *
               * The cost is real and deliberate: at scroll 0 the lower half of
               * the frame is a pine field rather than the illustration. It
               * clears completely by 0.26 of the track, before the pan reaches
               * anything worth looking at, so the reveal reads stronger for it.
               */}
              <div
                data-hero-scrim
                aria-hidden="true"
                className="from-pine/94 to-pine/88 pointer-events-none absolute inset-0 bg-linear-to-t"
              />
              <div
                data-hero-scrim-feather
                aria-hidden="true"
                className="from-pine/88 pointer-events-none absolute inset-x-0 bottom-full h-36 bg-linear-to-t to-transparent"
              />

              <Container className="relative">
                <div className="max-w-3xl">
                  <p className="text-eyebrow text-cloud font-medium uppercase">
                    Binghamton University
                  </p>
                  <h1
                    id="hero-title"
                    className="font-display text-display-xl text-cloud mt-5 font-semibold text-balance"
                  >
                    Learn to build apps with other students.
                  </h1>
                  <p className="text-lede text-cloud mt-6 max-w-xl">
                    HackBU runs web and mobile development workshops every week
                    and a hackathon once a year. You don’t need any programming
                    experience to come to either.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center gap-4">
                    {/* The ring has to read against the pine scrim, not cloud. */}
                    <ButtonLink href={DISCORD_URL} size="lg" focusTone="light">
                      Join the Discord
                    </ButtonLink>
                    <p className="text-caption text-cloud">
                      Free, open to all majors.
                    </p>
                  </div>
                </div>
              </Container>
            </div>
          </motion.div>
        </div>
      </HeroScrollContext>
    </section>
  )
}
