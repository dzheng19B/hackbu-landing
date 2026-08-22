import { Eyebrow, Section, SectionHeader } from '../../Layout'
import { Reveal, RevealGroup, RevealItem } from '../../Reveal'

const WORKSHOP_DETAILS = [
  {
    kicker: 'Every week',
    title: 'Development workshops',
    body: 'Each week we walk through building something for the web or for mobile. You work at your own pace, and organizers are in the room the whole time to help when something breaks.',
    meta: 'Web development one week, mobile the next. You can start at either.',
  },
  {
    kicker: 'What we cover',
    title: 'Web and mobile',
    body: 'Putting a page on screen, making it respond to someone using it, and getting an app running on a phone. You go at your own pace and organizers help when you get stuck.',
    meta: 'Starting from the first step.',
  },
  {
    kicker: 'Who can come',
    title: 'No experience required',
    body: 'A lot of our members started with none, and we write the workshops for that. If you’ve written code before, there’s still plenty here to build.',
    meta: 'Free, open to all majors.',
  },
] as const

export function WorkshopDetailsSection() {
  return (
    <Section
      id="workshops"
      labelledBy="workshops-title"
      className="bg-cloud"
    >
      <Reveal>
        <SectionHeader
          eyebrow="Weekly workshops"
          titleId="workshops-title"
          title="Show up and build something."
          lede="There’s no application, no dues, and no attendance to keep up. Come when it suits you and skip the weeks that don’t."
        />
      </Reveal>

      <RevealGroup as="ul" className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
        {WORKSHOP_DETAILS.map((item) => (
          <RevealItem
            as="li"
            key={item.title}
            className="border-frost bg-cloud flex flex-col rounded-2xl border p-7 sm:p-8"
          >
            <Eyebrow>{item.kicker}</Eyebrow>
            <h3 className="font-display text-display-md text-pine mt-4 font-semibold">
              {item.title}
            </h3>
            <p className="text-body text-pine mt-4">{item.body}</p>
            <p className="text-caption text-pine/90 mt-6">{item.meta}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
