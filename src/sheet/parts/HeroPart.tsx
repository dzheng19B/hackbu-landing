import { Block, Caption, Entry, Rows, Rule, SheetSection } from '../kit'
import { LINK_ON_CLOUD } from '../../components/ExternalLink'
import {
  CAMPUS_ALT,
  CAMPUS_HEIGHT,
  CAMPUS_PNG,
  CAMPUS_SRCSET,
  CAMPUS_WIDTH,
  cloudSources,
} from '../../lib/images'

/**
 * Part 4 — the hero, documented rather than embedded.
 *
 * <Hero> is a 260dvh scroll track with a sticky stage pinned inside it. Dropped
 * into this page it would hijack three viewports of the sheet's own scrolling
 * to play an animation that is about the top of the landing page, and the
 * sticky stage would be pinned against the sheet's scroll position rather than
 * its own. So what is here instead is the artwork it is made of, at rest, plus
 * the numbers that drive it.
 *
 * The numbers below are mirrored from src/components/Hero.tsx and
 * src/components/HeroClouds.tsx, which keep them as module-private constants —
 * there is nothing exported to import. They are the one thing on this sheet
 * that can drift; check them against those two files if the hero changes.
 */

/* -------------------------------------------------------------------------- */

type Param = { name: string; value: string; note: string }

const PAN_PARAMS: readonly Param[] = [
  {
    name: 'PAN_START_SCALE',
    value: '3',
    note: 'Scale of the illustration at scroll 0, easing to 1 as the pan runs. At 3 the stage shows at most the top third of the image at every aspect ratio — the first rooftops begin at 0.351 of the image height, so the binding constraint is scale > 2.85.',
  },
  {
    name: 'PAN_SCROLL_FRACTION',
    value: '0.75',
    note: 'The pan completes three-quarters of the way through the pinned scroll (120dvh of it). The last 0.25 (40dvh) is a hold on the finished frame before the stage unpins.',
  },
  {
    name: 'TRACK_HEIGHT',
    value: 'h-[260dvh]',
    note: 'The track exists only to buy scroll distance. The stage inside it is one viewport tall and sticky, so it stays pinned for 160dvh.',
  },
  {
    name: 'HERO_PAN_EASE',
    value: 'cubicBezier(0.4, 0, 0.35, 1)',
    note: 'Eases in and out only gently — the user’s own scrolling supplies the timing, and anything steeper reads as the image lagging behind the finger. Exported from src/lib/motion.ts.',
  },
  {
    name: 'object-position / transform-origin',
    value: 'object-[52%_0%] · origin-top',
    note: 'Pins the drawn content’s top edge to the top of the stage before any transform, so scale alone drives the pan and there is no translate. 52% horizontally is the Library Tower’s centre.',
  },
]

const CLOUD_LAYERS: readonly {
  id: string
  cutouts: readonly { file: string; width: number; height: number }[]
  scale: string
  opacity: string
  drift: string
  rise: string
  fade: string
}[] = [
  {
    id: 'far',
    cutouts: [
      { file: 'cloud-6.png', width: 224, height: 70 },
      { file: 'cloud-4.png', width: 266, height: 108 },
    ],
    scale: '0.55',
    opacity: '0.5',
    drift: '88s',
    rise: '10%',
    fade: '0.04 → 0.30',
  },
  {
    id: 'mid',
    cutouts: [
      { file: 'cloud-2.png', width: 430, height: 194 },
      { file: 'cloud-3.png', width: 263, height: 229 },
    ],
    scale: '0.8',
    opacity: '0.75',
    drift: '74s',
    rise: '16%',
    fade: '0.02 → 0.26',
  },
  {
    id: 'near',
    cutouts: [
      { file: 'cloud-5.png', width: 343, height: 253 },
      { file: 'cloud-1.png', width: 429, height: 259 },
    ],
    scale: '1.15',
    opacity: '1',
    drift: '62s',
    rise: '24%',
    fade: '0.01 → 0.22',
  },
]

/* -------------------------------------------------------------------------- */

export function HeroPart() {
  return (
    <SheetSection
      id="hero"
      number="4"
      title="The hero"
      intro="The one component on this sheet that is not rendered live. It is a 260dvh scroll track with a sticky stage inside it: embedded here it would take three viewports of the sheet’s scrolling and pin itself against the wrong scroll position. What follows is its artwork at rest and the numbers that drive it."
    >
      <Entry
        name="Hero"
        path="src/components/Hero.tsx"
        use="The top of the landing page, and nothing else. It is illustration only — no copy sits over it at any scroll position."
      >
        <Block title="See it live">
          <p className="text-body text-pine">
            {/* On cloud, so the cloud treatment: brick hover. */}
            <a href="/" className={`${LINK_ON_CLOUD} underline underline-offset-4`}>
              Open the landing page
            </a>{' '}
            and scroll: the illustration starts magnified on the sky and eases
            down to the whole campus over the first 120dvh.
          </p>
        </Block>

        <Block title="Layer contract">
          <Rows
            rows={[
              {
                name: '<section data-hero>',
                value: 'the scroll track',
                note: 'Taller than the viewport purely to buy scroll distance. No overflow-hidden — an overflow-clipped ancestor would become the sticky element’s scrollport and the stage would never pin.',
              },
              {
                name: '<div data-hero-stage>',
                value: 'sticky top-0, h-dvh',
                note: 'Exactly one viewport tall, and the element that clips the scaled artwork.',
              },
              {
                name: '<div data-hero-artwork>',
                value: 'the illustration',
                note: 'A <picture> — AVIF, then WebP, then the PNG as the <img src>. It is scaled up and panned down.',
              },
              {
                name: '<HeroClouds>',
                value: '[data-hero-clouds]',
                note: 'The three parallax cloud layers, over the artwork. Nothing sits above them — the pine legibility scrim went when the hero copy moved out.',
              },
            ]}
          />
        </Block>

        <Block title="The campus illustration, at rest">
          <div className="border-frost overflow-hidden rounded-xl border">
            <picture>
              <source type="image/avif" srcSet={CAMPUS_SRCSET.avif} sizes="(min-width: 64rem) 60rem, 92vw" />
              <source type="image/webp" srcSet={CAMPUS_SRCSET.webp} sizes="(min-width: 64rem) 60rem, 92vw" />
              <img
                src={CAMPUS_PNG}
                alt={CAMPUS_ALT}
                width={CAMPUS_WIDTH}
                height={CAMPUS_HEIGHT}
                decoding="async"
                loading="lazy"
                className="block h-auto w-full"
              />
            </picture>
          </div>
          <Caption>
            public/artwork/campus/Campus.png — {CAMPUS_WIDTH}×{CAMPUS_HEIGHT},
            with AVIF and WebP derivatives at 640/960/1280/1672. This is the
            frame the pan ends on; it opens at three times this size, showing
            only the sky and the ridgeline.
          </Caption>
        </Block>

        <Block title="Pan parameters">
          <Rows rows={PAN_PARAMS} />
          <Caption>
            These are module-private constants in src/components/Hero.tsx, not
            props — <b>&lt;Hero&gt;</b> takes none. Nothing configures the hero
            from outside.
          </Caption>
        </Block>

        <Block title="Reduced motion">
          <Rule>
            Under <b>prefers-reduced-motion</b> the pan is pinned to its end
            state — scale 1, the whole campus — <b>and the track collapses from
            260dvh to h-dvh</b>. Freezing the animation alone would strand the
            reader in two viewports of dead scroll space: a component that buys
            scroll distance has to give it back. The clouds follow the same
            camera, dropping to a third of their size and pinning by their
            bottom edges into the sky band above the ridgeline.
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="HeroClouds"
        path="src/components/HeroClouds.tsx"
        use="The hero’s cloud parallax. It renders the data-hero-clouds layer itself and is only valid inside the hero stage."
      >
        <Block title="The three layers">
          <ul className="border-frost border-t">
            {CLOUD_LAYERS.map((layer) => (
              <li key={layer.id} className="border-frost border-b py-5">
                <p className="text-body text-pine font-medium">{layer.id}</p>
                <p className="text-caption text-pine/90 mt-1">
                  scale {layer.scale} · opacity {layer.opacity} · drift{' '}
                  {layer.drift} per loop · rise {layer.rise} of the stage · fades
                  out over track progress {layer.fade}
                </p>
                <div className="bg-sky mt-3 flex flex-wrap items-end gap-4 rounded-xl p-4">
                  {layer.cutouts.map((cutout) => {
                    const sources = cloudSources(cutout.file)
                    return (
                      <picture key={cutout.file}>
                        <source type="image/avif" srcSet={sources.avif} />
                        <source type="image/webp" srcSet={sources.webp} />
                        <img
                          src={sources.png}
                          alt=""
                          width={cutout.width}
                          height={cutout.height}
                          decoding="async"
                          loading="lazy"
                          className="h-auto w-32 max-w-full sm:w-40"
                        />
                      </picture>
                    )
                  })}
                </div>
                <p className="text-caption text-pine/90 mt-2">
                  {layer.cutouts
                    .map((cutout) => `${cutout.file} (${cutout.width}×${cutout.height})`)
                    .join(' · ')}
                  {' — shown on '}
                  <b>bg-sky</b>, the ground they are actually cut against.
                </p>
              </li>
            ))}
          </ul>
          <Caption>
            The cutouts are cast by shape, not only size: cloud-6 (3.2:1) and
            cloud-4 (2.5:1) are flat wisps, which is what distant cloud reads
            as; cloud-1 and cloud-5 are tall cumulus towers, which is what a near
            cloud reads as. All three layers render at every viewport — at
            390×844 the stage clips all but 8 of the 24 mounted nodes, and the
            layer a reduction would take (far) is worth 1.19% of one viewport of
            alpha blending.
          </Caption>
        </Block>

        <Block title="The four-tile drift track">
          <Rule>
            Each layer is a scroll-linked wrapper (translateY + opacity) around a
            time-linked drift track (translateX, linear, infinite) — two motions
            on two elements so they never fight over one transform. The track
            holds <b>four</b> identical tiles, each one stage wide, and animates{' '}
            <b>-25% → -50%</b> of its own 400% width, i.e. exactly one tile of
            travel.
          </Rule>
          <Caption>
            Four rather than two because the near clouds deliberately hang off
            the viewport edges: measured over the specs, the worst overhang is
            0.08 of a stage width on the left (cloud-5 at left: -8%) and 0.4447
            on the right (cloud-1 at left: 76% + 68.47vw). With two tiles the
            start frame wanted a tile at -W and the end frame wanted one at +2W;
            neither existed, so a slice of cloud popped in at one edge and out at
            the other once every 62 seconds. The tile count is derived from those
            overhangs, not hardcoded — add a cloud that hangs further out and the
            track widens on its own.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="HeroScrollContext · useHeroScroll · usePrefersReducedMotion"
        path="src/lib/motion.ts"
        use="The hero publishes its scroll progress here; anything inside the stage reads it instead of opening a second scroll subscription."
      >
        <Block title="API">
          <Rows
            rows={[
              {
                name: 'usePrefersReducedMotion()',
                value: 'boolean',
                note: 'motion’s useReducedMotion() normalised from boolean | null. Every animating component in the project calls this one and renders its resting frame when it is true.',
              },
              {
                name: 'useHeroScroll()',
                value: 'HeroScroll',
                note: 'Returns { progress, reducedMotion }. Throws outside the hero stage.',
              },
              {
                name: 'HeroScroll.progress',
                value: 'MotionValue<number>',
                note: 'Raw 0→1 progress across the hero track — not the pan’s eased progress. The clouds keep fading through the tail of the track after the pan is done, so raw is the value they want.',
              },
              {
                name: 'HERO_PAN_EASE',
                value: 'cubicBezier(0.4, 0, 0.35, 1)',
                note: 'The pan’s curve.',
              },
              {
                name: 'rangeProgress(v, from, to)',
                value: 'number',
                note: 'Progress through a sub-window of a 0..1 value, clamped. How every fade and lift carves its own range out of the one scroll value.',
              },
            ]}
          />
        </Block>
        <Block title="Notes">
          <Caption>
            There is exactly one scroll subscription in the project and it is
            motion’s, in <b>Hero.tsx</b> — no hand-rolled scroll listener
            anywhere in src/. motion reads the reduced-motion query once at
            mount and does not re-subscribe, so a mid-session change to the OS
            setting takes effect on the next page load.
          </Caption>
        </Block>
      </Entry>
    </SheetSection>
  )
}
