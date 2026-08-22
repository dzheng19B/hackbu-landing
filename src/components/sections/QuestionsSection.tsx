import { Section, SectionHeader } from '../Layout'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'

/**
 * "Questions newcomers actually have" — exactly three, answered in plain
 * language. Static list by design: the answers are short enough that hiding
 * them behind a toggle would only add a click.
 *
 * The three rows stagger in as a RevealGroup.
 */

const QUESTIONS = [
  {
    question: 'What is a hackathon?',
    answer:
      'Teams get 24 to 48 hours to build a web app, a mobile app or a hardware project. You start from an idea and end with whatever you managed to make in the time. Almost nothing is finished by the end, and that’s the normal outcome.',
  },
  {
    question: 'Do I need experience?',
    answer:
      'No. A lot of our members started with none, and we write the workshops for that. If you’ve written code before, there’s still plenty here to build.',
  },
  {
    question: 'What do the workshops cover?',
    answer:
      'Web development and mobile development, starting from the first step: putting a page on screen, making it respond to someone using it, and getting an app running on a phone. You go at your own pace and organizers help when you get stuck.',
  },
] as const

export function QuestionsSection() {
  return (
    <Section id="questions" labelledBy="questions-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Things people ask us"
          titleId="questions-title"
          title="Questions newcomers actually have."
        />
      </Reveal>

      <RevealGroup as="dl" className="border-frost mt-12 border-t">
        {QUESTIONS.map((item) => (
          <RevealItem
            key={item.question}
            className="border-frost grid gap-3 border-b py-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-10"
          >
            <dt className="font-display text-display-md text-pine font-semibold text-balance">
              {item.question}
            </dt>
            <dd className="text-body text-pine max-w-2xl">{item.answer}</dd>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
