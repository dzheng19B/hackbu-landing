import { Eyebrow, Section } from '../../Layout'
import { Reveal } from '../../Reveal'

/** Schedule page masthead. The only <h1> on the page. */
export function ScheduleIntroSection() {
  return (
    <Section
      id="schedule-intro"
      labelledBy="schedule-intro-title"
      className="bg-cloud pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>Schedule</Eyebrow>
          <h1
            id="schedule-intro-title"
            className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
          >
            HackBU schedule
          </h1>
          <p className="text-lede text-pine mt-6 max-w-2xl">
            Our main recurring event is our weekly workshop, which is held every
            Monday at 7:30&nbsp;PM. We also have occasional special events on
            other days, sometimes in collaboration with other computer science
            groups on campus.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
