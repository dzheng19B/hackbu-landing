import { Container } from './Layout'
import { ButtonLink } from './ButtonLink'
import { DISCORD_URL } from '../lib/links'

/**
 * Full-viewport hero — exactly 100dvh this phase.
 *
 * Layer contract for later phases (nothing here animates yet):
 *
 *   <section data-hero>            the scroll TRACK. Phase 3 is the only thing
 *                                  that should change its height (h-dvh -> a
 *                                  taller track) to buy scroll distance for the
 *                                  pan. Nothing else on the page depends on it.
 *     <div data-hero-stage>        sticky top-0, always exactly one viewport
 *                                  tall. Pins itself once the track grows.
 *       <div data-hero-artwork>    Phase 3: public/artwork/campus/Campus.png,
 *                                  panned horizontally on scroll progress.
 *       <div data-hero-clouds>     Phase 4: cloud-1..6 parallax layers.
 *       <div data-hero-copy>       headline + CTA, above both art layers.
 *
 * Copy below is Phase 2 placeholder wording; Phase 5 replaces it.
 */
export function Hero() {
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="bg-sky relative h-dvh w-full overflow-hidden"
    >
      <div
        data-hero-stage
        className="sticky top-0 h-dvh w-full overflow-hidden"
      >
        {/* Phase 3 mounts the campus illustration here. */}
        <div data-hero-artwork aria-hidden="true" className="absolute inset-0" />

        {/* Phase 4 mounts the drifting cloud layers here. */}
        <div
          data-hero-clouds
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        />

        {/*
         * Legibility scrim. cloud-on-sky is only ~2.9:1 unaided; this bottom
         * gradient lifts the hero copy past 4.5:1 and stays transparent at the
         * top so it will not muddy the illustration Phase 3 pans behind it.
         */}
        <div
          data-hero-scrim
          aria-hidden="true"
          className="from-pine/60 via-pine/25 pointer-events-none absolute inset-0 bg-linear-to-t via-45% to-transparent"
        />

        <div
          data-hero-copy
          className="relative z-10 flex h-full flex-col justify-end pt-16 pb-14 sm:pt-20 sm:pb-20"
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
        </div>
      </div>
    </section>
  )
}
