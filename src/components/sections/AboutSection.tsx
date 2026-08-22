import { Eyebrow, Section, SectionHeader } from '../Layout'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'

/**
 * "What HackBU is" — mission statement plus the two pillars of the club,
 * side by side from `md` up and stacked below it.
 *
 * The header reveals on its own; the two pillars are a RevealGroup so they
 * land one after the other rather than together.
 */

const PILLARS = [
  {
    kicker: 'Every week',
    title: 'Development workshops',
    body: 'Each week we walk through building something for the web or for mobile. You work at your own pace, and organizers are in the room the whole time to help when something breaks.',
    meta: 'Web development one week, mobile the next. You can start at either.',
  },
  {
    kicker: 'Every year',
    title: 'An annual hackathon',
    body: 'Once a year we run our own hackathon: a weekend where teams build something that didn’t exist on Friday. It’s the same club, just packed into one weekend.',
    meta: 'One weekend, one team, one thing you made.',
  },
] as const

export function AboutSection() {
  return (
    <Section id="about" labelledBy="about-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="What HackBU is"
          titleId="about-title"
          title="A community of people who solve problems with technology."
          lede="HackBU is a student club at Binghamton that builds things — web apps, mobile apps, whatever the idea calls for — and learns the tools along the way. Plenty of people arrive having never written a line of code."
        />
      </Reveal>

      <RevealGroup as="ul" className="mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
        {PILLARS.map((pillar) => (
          <RevealItem
            as="li"
            key={pillar.title}
            className="border-frost bg-cloud flex flex-col rounded-2xl border p-7 sm:p-9"
          >
            <Eyebrow>{pillar.kicker}</Eyebrow>
            <h3 className="font-display text-display-md text-pine mt-4 font-semibold">
              {pillar.title}
            </h3>
            <p className="text-body text-pine mt-4">{pillar.body}</p>
            <p className="text-caption text-pine/90 mt-6">{pillar.meta}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
