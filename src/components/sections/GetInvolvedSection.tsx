import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { ExternalLink } from '../ExternalLink'
import { Reveal } from '../Reveal'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'

/**
 * "Get involved" — the conversion point of the whole page.
 *
 * The headline leads with the thing a hesitant first-year most needs to hear,
 * and the card below carries the page's largest brick button. The mailing list
 * is deliberately demoted to a text link so it never competes with it.
 */
export function GetInvolvedSection() {
  return (
    <Section
      id="get-involved"
      labelledBy="get-involved-title"
      className="bg-cloud"
    >
      <Reveal>
        <SectionHeader
          eyebrow="Get involved"
          titleId="get-involved-title"
          title="No membership or commitment required."
          lede="There is no application, no dues, and no attendance to keep up. Show up to a workshop when it suits you, skip the ones that do not. Everything we do gets announced in the Discord, so joining it is the whole first step."
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
                It is where workshops get announced, where people post what they
                are building, and where you can ask a question before you know
                the right words for it.
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

          <p className="text-caption text-haze border-stone/60 mt-8 border-t pt-6">
            The mailing list is for hackathon updates — dates, registration and
            what to expect.{' '}
            <ExternalLink
              href={MAILING_LIST_URL}
              className="text-pine hover:text-brick focus-visible:outline-pine underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Sign up for the mailing list
            </ExternalLink>{' '}
            if you would rather get those by email.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
