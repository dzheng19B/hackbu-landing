import { Section, SectionHeader } from '../Layout'

/**
 * "What HackBU is" — mission statement plus the two pillars of the club,
 * side by side from `md` up and stacked below it.
 *
 * Placeholder copy; Phase 5 replaces the wording, not the layout.
 */

const PILLARS = [
  {
    kicker: 'Every week',
    title: 'Development workshops',
    body: 'A short sentence about the weekly workshop: one topic, taught from zero, laptop optional.',
    meta: 'Beginner track and project track run in parallel.',
  },
  {
    kicker: 'Every spring',
    title: 'An annual hackathon',
    body: 'A short sentence about HackBU’s hackathon: a weekend to build something with people you just met.',
    meta: 'Teams form on the day. First-timers welcome.',
  },
] as const

export function AboutSection() {
  return (
    <Section id="about" labelledBy="about-title" className="bg-cloud">
      <SectionHeader
        eyebrow="What HackBU is"
        titleId="about-title"
        title="A student tech club that assumes you have never written code."
        lede="Two or three sentences of mission statement go here — who we are, who it is for, and the promise that no experience is required to show up."
      />

      <ul className="mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
        {PILLARS.map((pillar) => (
          <li
            key={pillar.title}
            className="border-frost bg-cloud flex flex-col rounded-2xl border p-7 sm:p-9"
          >
            <p className="text-eyebrow text-haze font-medium uppercase">
              {pillar.kicker}
            </p>
            <h3 className="font-display text-display-md text-pine mt-4 font-semibold">
              {pillar.title}
            </h3>
            <p className="text-body text-pine mt-4">{pillar.body}</p>
            <p className="text-caption text-haze mt-6">{pillar.meta}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
