import type { ReactNode } from 'react'

/**
 * Shared layout primitives. Later phases should compose these instead of
 * re-declaring widths, gutters or vertical rhythm.
 *
 *   Container      max-w-5xl (64rem), centred, 1.5rem/2rem gutters
 *   Section        vertical rhythm (py-20 / sm:py-28) + Container
 *   SectionHeader  eyebrow + display headline + optional lede
 */

/** Reusable content column: capped width, centred at every viewport size. */
export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-6 sm:px-8 ${className}`}>
      {children}
    </div>
  )
}

/** A full-width band on the page background, with its content in a Container. */
export function Section({
  id,
  labelledBy,
  children,
  className = '',
}: {
  id: string
  labelledBy?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`scroll-mt-24 py-20 sm:py-28 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  )
}

/** Standard section masthead: small uppercase label, headline, optional lede. */
export function SectionHeader({
  eyebrow,
  title,
  titleId,
  lede,
  className = '',
}: {
  eyebrow: string
  title: string
  titleId: string
  lede?: string
  className?: string
}) {
  return (
    <header className={`max-w-2xl ${className}`}>
      <p className="text-eyebrow text-haze font-medium uppercase">{eyebrow}</p>
      <h2
        id={titleId}
        className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
      >
        {title}
      </h2>
      {lede ? <p className="text-lede text-pine mt-5">{lede}</p> : null}
    </header>
  )
}
