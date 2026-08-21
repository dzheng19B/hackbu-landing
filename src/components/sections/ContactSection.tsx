import { Section, SectionHeader } from '../Layout'
import { ExternalLink, MailLink } from '../ExternalLink'
import { CONTACT_EMAIL, RESOURCES_URL } from '../../lib/links'

const LINK_CLASSES =
  'font-display text-display-md text-pine font-semibold underline ' +
  'underline-offset-8 hover:text-brick focus-visible:outline-2 ' +
  'focus-visible:outline-offset-4 focus-visible:outline-pine'

/**
 * "Contact" — the quiet landing at the bottom of the page: one email address
 * and a pointer at the resources archive, nothing else competing.
 */
export function ContactSection() {
  return (
    <Section id="contact" labelledBy="contact-title" className="bg-cloud">
      <SectionHeader
        eyebrow="Contact"
        titleId="contact-title"
        title="Still have a question?"
        lede="A short placeholder sentence inviting people to email the organizers directly, and noting roughly how quickly they will hear back."
      />

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <div>
          <p className="text-eyebrow text-haze font-medium uppercase">
            Email us
          </p>
          <MailLink email={CONTACT_EMAIL} className={`${LINK_CLASSES} mt-4 inline-block`} />
          <p className="text-caption text-haze mt-4">
            Goes to the organizing team.
          </p>
        </div>

        <div>
          <p className="text-eyebrow text-haze font-medium uppercase">
            Browse first
          </p>
          <ExternalLink
            href={RESOURCES_URL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            Workshop resources
          </ExternalLink>
          <p className="text-caption text-haze mt-4">
            Slides and code from past sessions.
          </p>
        </div>
      </div>
    </Section>
  )
}
