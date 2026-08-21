import { Section, SectionHeader } from '../Layout'

/**
 * "Questions newcomers actually have" — exactly three, answered in plain
 * language. Static list by design: the answers are short enough that hiding
 * them behind a toggle would only add a click.
 */

const QUESTIONS = [
  {
    question: 'Do I need to know how to code?',
    answer:
      'Placeholder answer: no. A sentence or two here about workshops starting from nothing and most people arriving with zero experience.',
  },
  {
    question: 'Do I have to be a computer science major?',
    answer:
      'Placeholder answer: no. A sentence about members coming from every school at Binghamton, and what non-CS students get out of it.',
  },
  {
    question: 'What actually happens at a meeting?',
    answer:
      'Placeholder answer describing an hour: a short walkthrough, time to build the thing yourself, and people around to unstick you.',
  },
] as const

export function QuestionsSection() {
  return (
    <Section id="questions" labelledBy="questions-title" className="bg-cloud">
      <SectionHeader
        eyebrow="Before you ask"
        titleId="questions-title"
        title="Questions newcomers actually have."
      />

      <dl className="border-frost mt-12 border-t">
        {QUESTIONS.map((item) => (
          <div
            key={item.question}
            className="border-frost grid gap-3 border-b py-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-10"
          >
            <dt className="font-display text-display-md text-pine font-semibold text-balance">
              {item.question}
            </dt>
            <dd className="text-body text-pine max-w-2xl">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
