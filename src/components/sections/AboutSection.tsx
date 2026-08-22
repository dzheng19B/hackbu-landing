import { Eyebrow, Section } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'

/**
 * "About us" — the page's masthead: mission, Discord and mailing-list CTAs.
 *
 * This copy used to sit inside the hero, over the illustration. It measured
 * 1.43:1 there and the only wash that fixed it covered most of the frame, so
 * Phase 7 moved it here instead: the hero stays pure illustration and the words
 * land on cloud, where `text-pine` is 6.83:1 and `text-pine/90` is 5.36:1.
 *
 * It carries the page's only <h1>, and it is the first heading in the document,
 * so the outline is h1 -> the three section h2s with no skipped level. That is
 * why the markup below is written out rather than reusing <SectionHeader>,
 * which is hard-wired to <h2>. The type and measure still match it
 * (`Eyebrow`, `text-display-lg`, `max-w-2xl`, lede at `mt-5`).
 *
 * The two CTAs use the same card chrome and two-column grid as the rest of the
 * page's paired blocks. `size="md"` keeps them smaller than the get-involved
 * card's Discord button (`size="lg"` plus `sm:px-10 sm:py-5`).
 *
 * **Reveal.** Header is a standard <Reveal>; the two cards are a RevealGroup.
 * That is safe even though this is the first content block: the hero's track
 * is 260dvh (one viewport under reduced motion, where <Reveal> drops its
 * motion props entirely), so this block is never within the viewport at mount.
 */

const CARD =
  'border-frost bg-cloud flex flex-col rounded-2xl border p-7 sm:p-9'

export function AboutSection() {
  return (
    <Section id="about" labelledBy="about-title" className="bg-cloud">
      <Reveal>
        <header className="max-w-2xl">
          <Eyebrow>About us</Eyebrow>
          <h1
            id="about-title"
            className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
          >
            HackBU exists to foster a community of individuals who solve
            problems through the innovative use of technology.
          </h1>
          <p className="text-lede text-pine mt-5">
            We host weekly development workshops and hold our own hackathon
            yearly.
          </p>
        </header>
      </Reveal>

      <RevealGroup as="ul" className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
        <RevealItem as="li" className={CARD}>
          <Eyebrow>Discord</Eyebrow>
          <p className="font-display text-display-md text-pine mt-4 font-semibold">
            Join our Discord
          </p>
          <p className="text-body text-pine mt-4">
            The best way to stay up to date on all of our events is to join our
            Discord server:
          </p>
          <div className="mt-auto pt-6">
            <ButtonLink href={DISCORD_URL} className="w-full sm:w-auto">
              Join our Discord
            </ButtonLink>
          </div>
        </RevealItem>
        <RevealItem as="li" className={CARD}>
          <Eyebrow>Mailing list</Eyebrow>
          <p className="font-display text-display-md text-pine mt-4 font-semibold">
            Join our Mailing List
          </p>
          <p className="text-body text-pine mt-4">
            We also send updates on our hackathon event to our mailing list:
          </p>
          <div className="mt-auto pt-6">
            <ButtonLink href={MAILING_LIST_URL} className="w-full sm:w-auto">
              Join our Mailing List
            </ButtonLink>
          </div>
        </RevealItem>
      </RevealGroup>

      <Reveal delay={0.1}>
        <p className="text-lede text-pine mt-8 max-w-2xl">
          No membership or commitment is required to be a part of our club! We
          look forward to seeing you at our events.
        </p>
      </Reveal>
    </Section>
  )
}
