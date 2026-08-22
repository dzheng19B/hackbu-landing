import { Section, SectionHeader } from '../../Layout'
import { ExternalLink, LINK_ON_FROST } from '../../ExternalLink'
import { Reveal } from '../../Reveal'
import { MAILING_LIST_URL } from '../../../lib/links'

export function RegistrationSection() {
  return (
    <Section
      id="register"
      labelledBy="register-title"
      className="bg-cloud scroll-mt-24"
    >
      <Reveal>
        <SectionHeader
          eyebrow="Registration"
          titleId="register-title"
          title="Registration opens in December."
          lede="We do not have a date, location, or schedule to share yet. When registration opens, we will post it here and on our mailing list."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="border-frost bg-frost mt-12 rounded-3xl border p-8 sm:p-12">
          <p className="font-display text-display-md text-pine font-semibold">
            Get notified when registration opens
          </p>
          <p className="text-body text-pine mt-3 max-w-xl">
            The mailing list is where we send hackathon dates, registration, and
            what to expect.{' '}
            <ExternalLink
              href={MAILING_LIST_URL}
              className={`${LINK_ON_FROST} underline underline-offset-4`}
            >
              Sign up for the mailing list
            </ExternalLink>{' '}
            if you want a heads-up in December.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
