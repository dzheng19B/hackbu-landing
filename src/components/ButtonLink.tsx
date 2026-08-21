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

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine'

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
