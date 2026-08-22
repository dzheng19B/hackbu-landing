import { useMemo, useRef } from 'react'
import { m, useScroll, useTransform } from 'motion/react'
import { HeroClouds } from './HeroClouds'
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
 * It is illustration and nothing else. Phase 7 moved the headline, lede and
 * Discord CTA out to <IntroSection>, on the cloud background below — cloud text
 * over the painted sky measured 1.43:1, and the only wash that lifted it past
 * 4.5:1 was a near-opaque pine field covering most of the frame. Removing the
 * copy retires that trade rather than tuning it: no text sits over the artwork
 * at any scroll position, so there is nothing left to make legible.
 *
 * Layer contract:
 *
 *   <section data-hero>            the scroll TRACK. Taller than the viewport
 *                                  purely to buy scroll distance for the pan.
 *     <div data-hero-stage>        sticky top-0, exactly one viewport tall.
 *       <div data-hero-artwork>    the campus illustration, as a <picture> —
 *                                  scaled up and panned down.
 *       <div data-hero-clouds>     the cloud-1..12 parallax layers.
 *
 * Everything inside the stage is wrapped in a HeroScrollContext, so the cloud
 * layers read the same progress values instead of opening a second scroll
 * subscription. See src/lib/motion.ts.
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

  const heroScroll = useMemo<HeroScroll>(
    () => ({ progress, reducedMotion }),
    [progress, reducedMotion],
  )

  return (
    <section
      id="top"
      data-hero
      ref={trackRef}
      // The header's logo link points here. Without a tab index the anchor
      // scrolls the page and leaves focus on <body>, so a keyboard user who
      // activates it is returned to the top visually and left where they were
      // in the tab order — the same shape as the skip link's target (P7-2, and
      // P2-4 in src/App.tsx, where the reasoning is written out). -1 keeps it
      // out of the tab order; `focus:outline-none` keeps the programmatic
      // focus from drawing the UA ring around the whole 260dvh track.
      tabIndex={-1}
      // The hero carries no heading now, so it names itself. Short on purpose:
      // this is the landmark's label, and the full description of what is in
      // the picture is the <img>'s alt (CAMPUS_ALT), one level down.
      aria-label="Campus illustration"
      // No `overflow-hidden` here: an overflow-clipped ancestor becomes the
      // sticky element's scrollport and the stage would never pin. The stage
      // clips the scaled artwork itself.
      className={`bg-sky relative w-full focus:outline-none ${reducedMotion ? 'h-dvh' : TRACK_HEIGHT}`}
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
              <m.img
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

          {/* The drifting cloud parallax. <HeroClouds> renders the
              `data-hero-clouds` layer itself and reads useHeroScroll() from the
              context above rather than opening its own subscription. */}
          <HeroClouds />
        </div>
      </HeroScrollContext>
    </section>
  )
}
