import { Container } from './Layout'
import { Wordmark } from './Wordmark'
import { ExternalLink, MailLink } from './ExternalLink'
import { CONTACT_EMAIL, SITE_PAGES, SOCIAL_LINKS } from '../lib/links'

/**
 * Footer: every existing hackbu.org page, the contact address, and the club's
 * social/repo accounts. Sits on frost so the page ends on the same snow the
 * dividers are made of.
 */

const FOOTER_LINK_CLASSES =
  'text-caption text-pine hover:text-brick focus-visible:outline-2 ' +
  'focus-visible:outline-offset-4 focus-visible:outline-pine'

const COLUMN_ONE = SITE_PAGES.slice(0, 4)
const COLUMN_TWO = SITE_PAGES.slice(4)

export function SiteFooter() {
  return (
    <footer className="bg-frost">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-4 md:gap-8">
          <div className="md:col-span-1">
            <Wordmark className="text-2xl" />
            <p className="text-caption text-haze mt-4 max-w-xs">
              The student tech club at Binghamton University. No experience
              required.
            </p>
          </div>

          <FooterColumn title="Club" links={COLUMN_ONE} />
          <FooterColumn title="More" links={COLUMN_TWO} />
          <FooterColumn title="Follow" links={SOCIAL_LINKS} />
        </div>

        <div className="border-stone/60 mt-14 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <MailLink
            email={CONTACT_EMAIL}
            className={`${FOOTER_LINK_CLASSES} underline underline-offset-4`}
          />
          <p className="text-caption text-haze">
            © {new Date().getFullYear()} HackBU · Binghamton University
          </p>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { readonly label: string; readonly href: string }[]
}) {
  return (
    <div>
      <h2 className="text-eyebrow text-haze font-medium uppercase">{title}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <ExternalLink href={link.href} className={FOOTER_LINK_CLASSES}>
              {link.label}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
