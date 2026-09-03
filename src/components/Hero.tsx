import { useMemo, useRef, useState } from 'react'
import { m, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
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
 * It is illustration and nothing else. The headline, lede and Discord CTA live
 * in <AboutSection> instead, on the cloud background below — cloud text over
 * the painted sky measures 1.43:1, and the only wash that lifts it past 4.5:1
 * is a near-opaque pine field covering most of the frame. Keeping the copy off
 * the hero avoids that trade rather than tuning it: no text sits over the
 * artwork at any scroll position, so there is nothing to make legible.
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
 * with its top edge pinned to the top of the stage (see `object-[49%_0%]` and
 * `origin-top` below). Writing `f1` for the fraction of the image's height that
 * `object-cover` leaves visible at scale 1, **the visible band at scale S runs
 * from 0 to f1/S**, and
 *
 *     viewport aspect <= 1672/941   ->  f1 = 1        (cover is height-bound)
 *     viewport aspect >  1672/941   ->  f1 = aspect_image / aspect_viewport
 *
 * Measured against the source file, the first brick of the dormitory
 * complexes begins at row 260 of 941 = 0.2763 of the image height. (Verified
 * by scanning the PNG for brick-orange pixels: every row above 260 returns
 * none, then the count passes 10 at row 260 and 40 within three rows.)
 *
 * `f1` never exceeds 1, so `f1/S <= 1/S` and S = 3.8 shows at most the top
 * 1/3.8 = 0.263 of the image at *every* aspect ratio — sky, clouds and the
 * bare winter hillsides, with 12 source pixels of clearance before the first
 * brick. The binding constraint is 1/S < 0.2763, i.e. **S > 3.62** — this
 * artwork's sky band is shorter than any before it, which is what pushed the
 * scale up from the long-standing 3. The cost of the extra magnification is
 * carried by the 4x-upscaled srcset rungs (see src/lib/images.ts, whose
 * `sizes` bakes in the same 3.8 factor). Viewports at or below 16:9 —
 * 1440x900 and every portrait screen — have `f1 = 1` and see the full
 * 0.263; wider ones only shrink the band.
 */
const PAN_START_SCALE = 3.8

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
 * An earlier scheme used `object-position: center` + `transform-origin: center`
 * and paid for the pin with a derived `translateY((S-1)/2 x 100%)`. Writing `C` for the
 * drawn content height and `H` for the stage height, that puts the content's
 * top edge at screen `S(H - C)/2`. On any viewport narrower than the artwork's
 * aspect, cover is height-constrained, `C = H`, and the expression is 0 —
 * pinned. On a viewport *wider* than the artwork cover flips to
 * width-constrained, `C > H`, and the top edge sits above the stage: the
 * visible band at scale 3 becomes `(1-f1)/2 .. (1-f1)/2 + f1/3`, which put
 * rooftops on screen at scroll 0 on wide viewports (measured 0.115..0.372
 * against an earlier artwork's 0.351 roofline at 1400x600).
 *
 * The fix is to stop compensating and move the two reference points instead:
 *
 *   object-position `49% 0%`   the drawn content's top edge sits on the stage's
 *                              top edge before any transform, at every aspect
 *   transform-origin `top`     scaling then grows downward from that edge
 *
 * so the top edge maps to screen 0 for all S, with no translate at all. The
 * visible band is `0 .. f1/S` everywhere, which starts at 0 rather than at
 * `(1-f1)/2` and is what makes the no-buildings criterion aspect-independent.
 * `translateY` is gone; scale alone drives the pan.
 *
 * The horizontal `49%` is the focal crop: the Library Tower is centred at
 * 0.4964 of the image width (the tallest run of brick-orange pixels in a
 * column scan), and on a 390x844 viewport cover draws the 16:9 image 1500 CSS
 * px wide and discards ~74% of it, so `center` would leave the tower ~5px
 * left of centre. It is applied at every width — above `sm` the horizontal
 * crop is small enough that the 1% shift is invisible, and one value is one
 * thing to reason about.
 *
 * (`origin-top` is `50% 0%`, so the horizontal half of the scale still grows
 * about the stage's centre and the tower stays centred through the whole pan.)
 *
 * The trade this accepts: above 16:9 the pan's end state shows the top `f1`
 * of the image rather than the middle `f1`. Cover has to crop something at
 * those aspects either way; cropping only the foreground plaza snow, and
 * keeping an exact top pin at every aspect with no viewport measurement, is
 * the better half of that trade. At or below 16:9 — 1440x900 and 390x844
 * included — nothing changes: `f1 = 1`, the band is `0..1/S`, and the pan
 * still ends on the whole illustration at scale 1.
 */
const CAMPUS_OBJECT_POSITION = 'object-[49%_0%]'

export function Hero() {
  const trackRef = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // The page's only scroll subscription, and it is motion's, not ours — no
  // hand-rolled `addEventListener('scroll', ...)` anywhere in src/. Everything
  // downstream — including HeroClouds's parallax — derives from this one value.
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
   * Is the pan actually moving? `will-change` is held ONLY inside the open
   * interval (0, PAN_SCROLL_FRACTION] — released at rest on both ends.
   *
   * The top release (p = 0) is the load-bearing one, and it is about
   * *sharpness*, not memory (measured live in an 800x455 Chromium pane,
   * 2026-09-03). With the hint present from the first render, the compositor
   * rasters the image layer once around hydration — before or as the scale(3)
   * transform lands — and then, because `will-change` tells it not to
   * re-raster on transform change, the start frame the reader sees is that
   * stale raster GPU-stretched 3x: blurry at every srcset rung, and showing a
   * subtly wrong crop. (Forced screenshots re-raster and hid this; toggling
   * the hint off live snapped the frame sharp.) With no hint at p = 0 the
   * browser paints the true scale-3 frame at full raster quality — this is
   * the frame the page opens on and holds, so it is exactly where quality
   * matters most. When scrolling starts the promotion arrives with the
   * current (~3x) transform, so the texture is rastered near its largest
   * scale and is only ever GPU-*down*scaled as the pan proceeds — supersampled
   * rather than smeared.
   *
   * The bottom release past `PAN_SCROLL_FRACTION` is P5-7 / P2-8, as before:
   * `scale` stops changing there, but the compositor keeps whatever the hint
   * bought for the life of the document. Measured with CDP `LayerTree` on
   * GPU-backed Edge: at track progress 0.8 the campus `<img>` was still its
   * own layer holding a full-viewport texture (5,130,000 B at 1440x900) with
   * `WillChangeTransform` as its only compositing reason. Dropping the hint
   * lets that texture go.
   *
   * Both directions re-arm when the reader scrolls back into the interval, so
   * neither release is a one-way latch. The same shape as `drifting` in
   * HeroClouds: motion's own `useMotionValueEvent` on the single `useScroll`
   * value — still no `scroll` listener in `src/` — and the boolean changes at
   * most twice per traversal, so React bails out of a re-render on every
   * frame either side of a crossing.
   */
  const [panning, setPanning] = useState(() => {
    const p = progress.get()
    return p > 0 && p <= PAN_SCROLL_FRACTION
  })
  useMotionValueEvent(progress, 'change', (p) => {
    setPanning(p > 0 && p <= PAN_SCROLL_FRACTION)
  })

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
      // the picture is the <img>'s alt (CAMPUS_ALT), one level down. Kept as
      // is: the overlap with the alt is P4-7, which passes 1.1.1 and 1.3.1 on
      // both counts — the label is what a landmark list shows, the alt is what
      // the picture says, and dropping either loses one of the two.
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
                // `will-change` only while the scale is actually moving: never
                // under reduced motion (where it is pinned to 1), never at
                // rest at scroll 0 (where the hint made the compositor show a
                // stale low-res raster of the start frame), and released past
                // `PAN_SCROLL_FRACTION` — see `panning` above.
                className={`h-full w-full origin-top ${CAMPUS_OBJECT_POSITION} object-cover select-none ${
                  reducedMotion || !panning ? '' : 'will-change-transform'
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
