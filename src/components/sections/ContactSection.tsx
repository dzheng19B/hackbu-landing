import { Section, SectionHeader } from '../Layout'
import { ExternalLink, MailLink } from '../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
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
      <Reveal>
        <SectionHeader
          eyebrow="Contact"
          titleId="contact-title"
          title="Still have a question?"
          lede="Email the organizers and ask it. It’s a small team of students, and no question is too basic to send."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-10 sm:grid-cols-2">
        <RevealItem>
          <p className="text-eyebrow text-pine/90 font-medium uppercase">
            Email us
          </p>
          <MailLink
            email={CONTACT_EMAIL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          />
          <p className="text-caption text-pine/90 mt-4">
            Goes to the organizing team.
          </p>
        </RevealItem>

        <RevealItem>
          <p className="text-eyebrow text-pine/90 font-medium uppercase">
            If you want a head start
          </p>
          <ExternalLink
            href={RESOURCES_URL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            Workshop resources
          </ExternalLink>
          <p className="text-caption text-pine/90 mt-4">
            Material from past workshops, in case you’d like a look before you
            show up.
          </p>
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}
