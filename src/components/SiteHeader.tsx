import { useEffect, useRef, useState } from 'react'
import { Container } from './Layout'
import { Wordmark } from './Wordmark'
import { ExternalLink } from './ExternalLink'
import { ButtonLink } from './ButtonLink'
import { DISCORD_URL, NAV_LINKS } from '../lib/links'

/**
 * Fixed page header: wordmark + three destinations + the Discord CTA.
 *
 * The bar is `h-16` (4rem) below `sm` and `h-20` (5rem) from `sm` up; anything
 * that needs to clear it (the hero content, scroll anchors) uses those numbers.
 *
 * Below `md` (768px) the three links and the CTA collapse behind a toggle, so
 * the 390px layout is a wordmark plus a menu button. The toggle is a real
 * <button> — Enter/Space operate it, Escape closes it, and the panel it
 * controls stays in the DOM so `aria-controls` always resolves.
 */

const NAV_LINK_CLASSES =
  'text-body text-pine hover:text-brick focus-visible:outline-2 ' +
  'focus-visible:outline-offset-4 focus-visible:outline-pine'

export function SiteHeader() {
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
          href="#top"
          className="focus-visible:outline-pine rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Wordmark className="text-2xl sm:text-3xl" />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <ExternalLink
              key={link.label}
              href={link.href}
              className={NAV_LINK_CLASSES}
            >
              {link.label}
            </ExternalLink>
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
          className="border-frost text-pine hover:bg-frost focus-visible:outline-pine -mr-2 inline-flex items-center justify-center rounded-full border p-2 focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
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
              <ExternalLink
                key={link.label}
                href={link.href}
                className={`${NAV_LINK_CLASSES} rounded-lg px-2 py-3`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </ExternalLink>
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
