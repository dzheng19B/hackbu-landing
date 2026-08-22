import type { AnchorHTMLAttributes, ReactNode } from 'react'

/* -------------------------------------------------------------------------- */
/* Shared link treatments                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every text link on the page uses one of the two strings below, picked by the
 * surface it sits on. They exist so the surface rule is structural rather than
 * a convention four separate class-strings each had to remember:
 *
 *   **cloud** (`#F7F5EE`) — hover recolours to `grove`, which measures ~7.7:1
 *   there and clears AA.
 *   **frost** (`#DCE3EA`) — hover underlines instead. `grove` is reserved for
 *   cloud; thickening an underline on frost signals the same thing and costs
 *   no contrast.
 *
 * Pick by the background the link is actually painted on, not by the component
 * it lives in: the header and the content sections are cloud, the footer and
 * the get-involved card are frost. Both strings carry the page's one focus
 * ring — pine, offset 4 — which reads at 6.83:1 on cloud and 5.76:1 on frost,
 * so it needs no per-surface variant.
 *
 * Typography is deliberately *not* here. A link's size, weight and resting
 * underline belong to its context; what these fix is only the part that has a
 * contrast answer.
 */
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-pine'

/** Links on `cloud`. Brick hover. */
export const LINK_ON_CLOUD = `text-pine hover:text-grove ${FOCUS_RING}`

/** Links on `frost`. Underline hover — never grove. */
export const LINK_ON_FROST =
  'text-pine hover:underline hover:decoration-2 hover:underline-offset-4 ' +
  FOCUS_RING

type ExternalLinkProps = {
  href: string
  children: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>

/**
 * Every off-site link on the page goes through here so the new-tab + rel
 * hardening can never be forgotten. mailto: links use MailLink instead — a
 * mail client should not open in a throwaway browser tab.
 */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export function MailLink({
  email,
  children,
  ...rest
}: { email: string; children?: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'children'
>) {
  return (
    <a {...rest} href={`mailto:${email}`}>
      {children ?? email}
    </a>
  )
}
