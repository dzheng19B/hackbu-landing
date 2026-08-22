import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Container } from './Layout'
import { Wordmark } from './Wordmark'
import { ExternalLink, LINK_ON_CLOUD } from './ExternalLink'
import { TOGGLE_ON_CLOUD } from './controls'
import { ButtonLink } from './ButtonLink'
import { DISCORD_URL, NAV_LINKS } from '../lib/links'

/**
 * Fixed page header: the HackBU logo lockup + five destinations + the
 * Discord CTA.
 *
 * The bar is `h-16` (4rem) below `sm` and `h-20` (5rem) from `sm` up; anything
 * that needs to clear it (the hero content, scroll anchors) uses those numbers.
 *
 * Below `md` (768px) the five links and the CTA collapse behind a toggle, so
 * the 390px layout is the lockup plus a menu button.
 *
 * The toggle is a real <button> — Enter/Space operate it, Escape closes it,
 * and the panel it controls stays in the DOM so `aria-controls` always
 * resolves.
 *
 * Both the bar and the compact panel are opaque `bg-cloud`, so every link in
 * here takes the cloud treatment — brick hover. See LINK_ON_CLOUD in
 * ExternalLink.tsx.
 *
 * Off-site destinations go through <ExternalLink> (new tab). In-site ones
 * (About us, Schedule, Sponsors) are ordinary same-tab anchors.
 */

const NAV_LINK_CLASSES = `text-body ${LINK_ON_CLOUD}`

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

export function SiteHeader({
  homeHref = '/',
  currentHref,
}: {
  /** Lockup destination. Landing uses `#top`; other pages use `/`. */
  homeHref?: string
  /** Marks the matching nav item as the current page. */
  currentHref?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      // Focus would otherwise be stranded on a link inside the hidden panel,
      // restarting Tab from the top of the page.
      toggleRef.current?.focus()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <header className="border-frost bg-cloud fixed inset-x-0 top-0 z-50 border-b">
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <a
          href={homeHref}
          className="focus-visible:outline-pine rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Wordmark className="text-2xl sm:text-3xl" />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavItem
              key={link.label}
              href={link.href}
              current={link.href === currentHref}
              className={NAV_LINK_CLASSES}
            >
              {link.label}
            </NavItem>
          ))}
          <ButtonLink href={DISCORD_URL} size="sm">
            Discord
          </ButtonLink>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className={`${TOGGLE_ON_CLOUD} -mr-2 inline-flex items-center justify-center rounded-full p-2 md:hidden`}
        >
          <span className="sr-only">
            {menuOpen ? 'Close menu' : 'Open menu'}
          </span>
          <MenuGlyph open={menuOpen} />
        </button>
      </Container>

      {/* Stays mounted so aria-controls always points at a real element. */}
      <div
        id="primary-menu"
        hidden={!menuOpen}
        className="border-frost bg-cloud border-t md:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Primary — compact" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.label}
                href={link.href}
                current={link.href === currentHref}
                className={`${NAV_LINK_CLASSES} rounded-lg px-2 py-3`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavItem>
            ))}
            <ButtonLink
              href={DISCORD_URL}
              size="md"
              className="mt-3"
              onClick={() => setMenuOpen(false)}
            >
              Join the Discord
            </ButtonLink>
          </nav>
        </Container>
      </div>
    </header>
  )
}

function NavItem({
  href,
  current,
  className,
  onClick,
  children,
}: {
  href: string
  current?: boolean
  className: string
  onClick?: () => void
  children: ReactNode
}) {
  if (isExternalHref(href)) {
    return (
      <ExternalLink href={href} className={className} onClick={onClick}>
        {children}
      </ExternalLink>
    )
  }

  return (
    <a
      href={href}
      className={className}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
    >
      {children}
    </a>
  )
}

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6 L18 18" />
          <path d="M18 6 L6 18" />
        </>
      ) : (
        <>
          <path d="M4 8 H20" />
          <path d="M4 16 H20" />
        </>
      )}
    </svg>
  )
}
