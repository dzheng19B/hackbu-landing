import { Eyebrow, Section } from '../../Layout'
import { Reveal } from '../../Reveal'

export function HackathonIntroSection() {
  return (
    <Section
      id="hackathons-intro"
      labelledBy="hackathons-intro-title"
      className="bg-cloud"
    >
      <Reveal>
        <div className="max-w-3xl">
          <Eyebrow>Hackathons</Eyebrow>
          <h1
            id="hackathons-intro-title"
            className="font-display text-display-xl text-pine mt-5 font-semibold text-balance"
          >
            Our annual hackathon
          </h1>
          <p className="text-lede text-pine mt-6 max-w-2xl">
            Hackathons are events where teams build a program or hardware project
            in a short window of time. Most last 24 to 48 hours and are full of
            caffeine, food, prizes, and little sleep.
          </p>
          <p className="text-body text-pine mt-5 max-w-2xl">
            Once a year we run our own: a weekend where teams build something
            that did not exist on Friday. It is the same club as our weekly
            workshops, just packed into one weekend.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
