import type { ReactNode } from 'react'
import { ExternalLink } from './ExternalLink'

/**
 * The page's only button treatments.
 *   primary   solid brick — reserved for the Discord conversion action
 *   secondary outlined pine — supporting actions
 *
 * brick is the single accent in the palette, so a `primary` button on screen
 * should always mean "join the Discord".
 */
type Variant = 'primary' | 'secondary'
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
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brick text-cloud hover:bg-pine',
  secondary: 'border border-pine text-pine hover:bg-frost',
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-caption',
  md: 'px-6 py-3 text-body',
  lg: 'px-8 py-4 text-lede',
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: {
  href: string
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  onClick?: () => void
}) {
  return (
    <ExternalLink
      href={href}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </ExternalLink>
  )
}
