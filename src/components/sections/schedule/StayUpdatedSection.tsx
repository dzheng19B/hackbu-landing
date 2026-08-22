import { Section, SectionHeader } from '../../Layout'
import { ButtonLink } from '../../ButtonLink'
import { ExternalLink, LINK_ON_FROST } from '../../ExternalLink'
import { Reveal } from '../../Reveal'
import { DISCORD_URL, MAILING_LIST_URL } from '../../../lib/links'

export function StayUpdatedSection() {
  return (
    <Section
      id="stay-updated"
      labelledBy="stay-updated-title"
      className="bg-cloud"
    >
      <Reveal>
        <SectionHeader
          eyebrow="How we announce events"
          titleId="stay-updated-title"
          title="Check your email or Discord."
          lede="We announce our events a day before on our mailing list, and the day of on our Discord server."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="border-frost bg-frost mt-12 rounded-3xl border p-8 sm:p-12">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="font-display text-display-md text-pine font-semibold">
                Join the HackBU Discord
              </p>
              <p className="text-body text-pine mt-3">
                It’s where we announce workshops, where people post what they’re
                building, and where you can ask a question before you know the
                right words for it.
              </p>
            </div>
            <ButtonLink
              href={DISCORD_URL}
              size="lg"
              className="w-full sm:w-auto sm:shrink-0 sm:px-10 sm:py-5"
            >
              Join the Discord
            </ButtonLink>
          </div>

          <p className="text-caption text-pine/90 border-stone/60 mt-8 border-t pt-6">
            The mailing list is for hackathon updates too.{' '}
            <ExternalLink
              href={MAILING_LIST_URL}
              className={`${LINK_ON_FROST} underline underline-offset-4`}
            >
              Sign up for the mailing list
            </ExternalLink>{' '}
            if you’d rather get those by email.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
