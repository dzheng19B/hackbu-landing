import type { ReactNode } from 'react'
import { ExternalLink } from './ExternalLink'

/**
 * The page's only button treatment: solid grove (Binghamton PMS 342), reserved
 * for conversion actions. Size is the only thing that varies.
 *
 * grove is the single interactive accent, so a button on screen always means
 * a join action — which is why there is one treatment and not a set. (A
 * `secondary` outlined-pine variant was declared here for supporting actions.
 * The finished page has none: every button is a join CTA, and the resources
 * archive and the nav are all text links. It went unused through every phase
 * and is gone; a second treatment can come back with the second kind of action
 * that needs it.)
 */
type Size = 'sm' | 'md' | 'lg'

/**
 * The focus ring is drawn `outline-offset-2`, so the colour it has to stand out
 * against is whatever surrounds the button, not the button itself. Every button
 * on the page now sits on cloud or frost, where a pine ring reads at 6.83:1 and
 * 5.76:1 respectively — so one ring colour covers the whole page.
 *
 * (A `light` variant existed for the hero CTA, whose ring had to clear the pine
 * legibility scrim. Phase 7 moved that CTA onto cloud with the rest of the hero
 * copy and the scrim went with it, leaving nothing that needed the second tone.)
 */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'bg-grove text-cloud hover:bg-pine ' +
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2'

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-6 py-3 text-body',
  lg: 'px-8 py-4 text-lede',
}

export function ButtonLink({
  href,
  children,
  size = 'md',
  className = '',
  ...rest
}: {
  href: string
  children: ReactNode
  size?: Size
  className?: string
  onClick?: () => void
}) {
  return (
    <ExternalLink
      href={href}
      className={`${BASE} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </ExternalLink>
  )
}
