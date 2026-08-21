import { Section, SectionHeader } from '../Layout'
import { ButtonLink } from '../ButtonLink'
import { ExternalLink } from '../ExternalLink'
import { DISCORD_URL, MAILING_LIST_URL } from '../../lib/links'

/**
 * "Get involved" — the conversion point of the whole page.
 *
 * One dominant brick CTA into Discord; the mailing list is deliberately
 * demoted to a text link so it never competes with it.
 */
export function GetInvolvedSection() {
  return (
    <Section id="get-involved" labelledBy="get-involved-title" className="bg-cloud">
      <SectionHeader
        eyebrow="Get involved"
        titleId="get-involved-title"
        title="Everything starts in the Discord."
        lede="A sentence explaining that the Discord is where meetings get announced, questions get answered, and nobody minds beginner questions."
      />

      <div className="border-frost bg-frost mt-12 rounded-3xl border p-8 sm:p-12">
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="font-display text-display-md text-pine font-semibold">
              Join the HackBU Discord
            </p>
            <p className="text-body text-pine mt-3">
              One placeholder line about what happens the moment you land in the
              server.
            </p>
          </div>
          <ButtonLink
            href={DISCORD_URL}
            size="lg"
            className="w-full sm:w-auto sm:shrink-0"
          >
            Join the Discord
          </ButtonLink>
        </div>

        <p className="text-caption text-haze border-stone/60 mt-8 border-t pt-6">
          Prefer email?{' '}
          <ExternalLink
            href={MAILING_LIST_URL}
            className="text-pine focus-visible:outline-pine underline underline-offset-4 hover:text-brick focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Sign up for the mailing list
          </ExternalLink>{' '}
          and we will send the schedule instead.
        </p>
      </div>
    </Section>
  )
}
