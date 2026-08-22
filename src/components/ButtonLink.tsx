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
 * Which way the focus ring has to contrast.
 *
 * The ring is drawn `outline-offset-2`, so the colour it has to stand out
 * against is whatever surrounds the button, not the button itself. Everywhere
 * on the page that is cloud or frost, and a pine ring reads at 6.83:1 / 5.76:1.
 * Inside the hero it is the copy scrim — pine at 0.88-0.94 — and a pine ring on
 * a pine field is 1.2:1, i.e. no visible focus at all. `light` swaps it for a
 * cloud ring, which is 5.3:1 against that scrim and 4.78:1 against the brick
 * button it wraps.
 */
type FocusTone = 'dark' | 'light'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2'

const FOCUS_TONES: Record<FocusTone, string> = {
  dark: 'focus-visible:outline-pine',
  light: 'focus-visible:outline-cloud',
}

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
  focusTone = 'dark',
  className = '',
  ...rest
}: {
  href: string
  children: ReactNode
  variant?: Variant
  size?: Size
  focusTone?: FocusTone
  className?: string
  onClick?: () => void
}) {
  return (
    <ExternalLink
      href={href}
      className={`${BASE} ${FOCUS_TONES[focusTone]} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </ExternalLink>
  )
}
