import { Section } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { Reveal } from '../Reveal'
import { DISCORD_URL } from '../../lib/links'

/**
 * The page's masthead — headline, lede and the Discord CTA.
 *
 * This copy used to sit inside the hero, over the illustration. It measured
 * 1.43:1 there and the only wash that fixed it covered most of the frame, so
 * Phase 7 moved it here instead: the hero stays pure illustration and the words
 * land on cloud, where `text-pine` is 6.83:1 and `text-pine/90` is 5.36:1.
 *
 * It carries the page's only <h1>, and it is the first heading in the document,
 * so the outline is h1 -> the four section h2s with no skipped level. That is
 * why the markup below is written out rather than reusing <SectionHeader>,
 * which is hard-wired to <h2>.
 *
 * **CTA weight.** `size="lg"` with no width override measures 223x64px, the
 * same box the hero CTA had. The get-involved card's button adds
 * `sm:px-10 sm:py-5` and measures 239x72px, so it stays the single largest CTA
 * on the page — this one leads, that one converts.
 *
 * **Reveal.** Standard <Reveal>, same as every other section header. It is safe
 * here even though it is the first content block: the hero's track is 260dvh
 * (one viewport under reduced motion, where <Reveal> drops its motion props
 * entirely), so this block is never within the viewport at mount. If a reload
 * restores scroll to it, IntersectionObserver delivers an initial observation
 * for every newly observed target regardless of scroll position, which is the
 * same path that makes the shipped section reveals work.
 */
export function IntroSection() {
  return (
    <Section id="intro" labelledBy="intro-title" className="bg-cloud">
      <Reveal>
        <div className="max-w-3xl">
          <p className="text-eyebrow text-pine/90 font-medium uppercase">
            Binghamton University
          </p>
          <h1
            id="intro-title"
            className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
          >
            Learn to build apps with other students.
          </h1>
          <p className="text-lede text-pine mt-6 max-w-xl">
            HackBU runs web and mobile development workshops every week and a
            hackathon once a year. You don’t need any programming experience to
            come to either.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href={DISCORD_URL} size="lg">
              Join the Discord
            </ButtonLink>
            <p className="text-caption text-pine/90">
              Free, open to all majors.
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
