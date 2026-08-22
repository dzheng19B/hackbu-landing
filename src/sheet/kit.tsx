import type { ReactNode } from 'react'

/**
 * The sheet's own chrome — cards, prop tables, demo grounds, section headings.
 *
 * None of this is a landing-page component and none of it belongs in one. It
 * exists so the documented components can be shown *as themselves*, with a
 * frame around them that is visibly not part of what is being documented.
 *
 * It draws on the same ten tokens and the same type scale as the page: cloud
 * and frost for grounds, frost for rules and borders, pine for text, pine/90
 * for labels, grove nowhere (it is the page's interactive accent, and the sheet
 * has no interactions of its own worth spending it on) — except where a real
 * component brings it.
 */

/* -------------------------------------------------------------------------- */
/* Structure                                                                  */
/* -------------------------------------------------------------------------- */

/** The sheet's content column. Wider than the page's, since specs sit beside demos. */
export function Column({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  )
}

/** One numbered part of the sheet. `id` is what the sticky nav links to. */
export function SheetSection({
  id,
  number,
  title,
  intro,
  children,
}: {
  id: string
  number: string
  title: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 py-14 sm:py-20">
      <Column>
        <p className="text-eyebrow text-pine/90 font-medium uppercase">
          Part {number}
        </p>
        <h2
          id={`${id}-title`}
          className="font-display text-display-lg text-pine mt-3 font-semibold text-balance"
        >
          {title}
        </h2>
        {intro ? <div className="text-body text-pine mt-4 max-w-2xl">{intro}</div> : null}
        <div className="mt-10 flex flex-col gap-10">{children}</div>
      </Column>
    </section>
  )
}

/**
 * One documented thing: what it is called, where it lives, when to reach for
 * it, then its API, then it rendered for real.
 */
export function Entry({
  name,
  path,
  use,
  children,
}: {
  name: string
  path: string
  use: string
  children: ReactNode
}) {
  return (
    <article className="border-frost rounded-2xl border">
      <header className="border-frost border-b px-5 py-5 sm:px-7">
        <h3 className="font-display text-display-md text-pine font-semibold">
          {name}
        </h3>
        <p className="text-caption text-pine/90 mt-2 break-words">{path}</p>
        <p className="text-body text-pine mt-3 max-w-2xl">{use}</p>
      </header>
      <div className="flex flex-col gap-7 px-5 py-6 sm:px-7">{children}</div>
    </article>
  )
}

/** A labelled block inside an entry — "Props", "Variants", "Why". */
export function Block({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h4 className="text-eyebrow text-pine/90 font-medium uppercase">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * The rule a component encodes, stated plainly. This is the part of a
 * component sheet that is worth reading twice — the contrast measurement, the
 * accessibility decision, the reason a variant does not exist.
 */
export function Rule({ children }: { children: ReactNode }) {
  return (
    <p className="text-body text-pine border-stone/60 max-w-2xl border-l-2 pl-4">
      {children}
    </p>
  )
}

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

export type PropRow = {
  name: string
  type: string
  /** Written exactly as the default appears in the source, or omitted if required. */
  fallback?: string
  note: string
}

/**
 * Props as actually written in the component's own signature — not an idealised
 * API. Stacks on narrow viewports rather than scrolling sideways.
 */
export function Props({ rows }: { rows: readonly PropRow[] }) {
  return (
    <dl className="border-frost border-t">
      {rows.map((row) => (
        <div
          key={row.name}
          className="border-frost grid gap-x-6 gap-y-1 border-b py-3 md:grid-cols-[minmax(0,10rem)_minmax(0,16rem)_1fr]"
        >
          <dt className="text-caption text-pine font-medium break-words">
            {row.name}
            {row.fallback === undefined ? (
              <span className="text-pine/90 font-normal"> (required)</span>
            ) : null}
          </dt>
          <dd className="text-caption text-pine/90 break-words">
            {row.type}
            {row.fallback !== undefined ? (
              <span className="text-pine/90"> — default {row.fallback}</span>
            ) : null}
          </dd>
          <dd className="text-caption text-pine/90">{row.note}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The same three-column shape as `Props`, without the required/default
 * grammar — for things that are not props: module constants, context values,
 * the elements of a layer contract.
 */
export function Rows({
  rows,
}: {
  rows: readonly { name: string; value: string; note: ReactNode }[]
}) {
  return (
    <ul className="border-frost border-t">
      {rows.map((row) => (
        <li
          key={row.name}
          className="border-frost grid gap-x-6 gap-y-1 border-b py-3 md:grid-cols-[minmax(0,14rem)_minmax(0,12rem)_1fr]"
        >
          <span className="text-caption text-pine font-medium break-words">
            {row.name}
          </span>
          <span className="text-caption text-pine/90 break-words">{row.value}</span>
          <span className="text-caption text-pine/90">{row.note}</span>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Demo grounds                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A demo ground, in one of the two page backgrounds.
 *
 * Which one matters constantly: half the rules in this system are "on cloud do
 * X, on frost do Y", so a demo that does not say which ground it is standing
 * on is a demo of nothing. The label is part of the specimen.
 */
export function Ground({
  tone,
  label,
  children,
  className = '',
}: {
  tone: 'cloud' | 'frost'
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="border-frost overflow-hidden rounded-xl border">
      {label ? (
        <p className="text-eyebrow text-pine/90 border-frost bg-cloud border-b px-4 py-2 font-medium uppercase">
          {label}
        </p>
      ) : null}
      <div className={`${tone === 'cloud' ? 'bg-cloud' : 'bg-frost'} p-5 sm:p-7 ${className}`}>
        {children}
      </div>
    </div>
  )
}

/** A caption under a specimen: the measured number, the state, the caveat. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-caption text-pine/90 mt-3">{children}</p>
}

/**
 * A full-bleed frame for a composed component that expects to own the page
 * width — the header, the footer, a section band.
 */
export function Stage({
  label,
  note,
  children,
  className = '',
}: {
  label: string
  note?: string
  children: ReactNode
  className?: string
}) {
  return (
    <figure className="border-frost overflow-hidden rounded-2xl border">
      <figcaption className="text-eyebrow text-pine/90 border-frost bg-cloud border-b px-4 py-2 font-medium uppercase">
        {label}
      </figcaption>
      <div className={className}>{children}</div>
      {note ? (
        <p className="text-caption text-pine/90 border-frost bg-cloud border-t px-4 py-3">
          {note}
        </p>
      ) : null}
    </figure>
  )
}
