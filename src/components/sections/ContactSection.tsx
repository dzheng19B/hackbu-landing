import { Eyebrow, Section, SectionHeader } from '../Layout'
import { ExternalLink, LINK_ON_CLOUD, MailLink } from '../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../Reveal'
import { CONTACT_EMAIL, RESOURCES_URL } from '../../lib/links'

/* This section is on cloud, so brick is the hover. */
const LINK_CLASSES =
  'font-display text-display-md font-semibold underline underline-offset-8 ' +
  LINK_ON_CLOUD

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
          <Eyebrow>Email us</Eyebrow>
          <MailLink
            email={CONTACT_EMAIL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          />
          <p className="text-caption text-pine/90 mt-4">
            Goes to the organizing team.
          </p>
        </RevealItem>

        <RevealItem>
          <Eyebrow>If you want a head start</Eyebrow>
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
