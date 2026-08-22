import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { ExternalLink, LINK_ON_FROST } from '../ExternalLink'
import { Reveal } from '../Reveal'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'

/**
 * "Get involved" — the conversion point of the whole page.
 *
 * The headline leads with the thing a hesitant first-year most needs to hear,
 * and the card below carries the page's largest grove button. The mailing list
 * is deliberately demoted to a text link so it never competes with it.
 *
 * The card is `bg-frost`, so that link takes the frost treatment — an underline
 * on hover, never grove. See LINK_ON_FROST in ExternalLink.tsx.
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
          lede="There’s no application, no dues, and no attendance to keep up. Show up to a workshop when it suits you, skip the ones that don’t. We announce everything we do in the Discord, so joining it is the whole first step."
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
            The mailing list is for hackathon updates — dates, registration and
            what to expect.{' '}
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
