import type { AnchorHTMLAttributes, ReactNode } from 'react'

/* -------------------------------------------------------------------------- */
/* Shared link treatments                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every text link on the page uses one of the two strings below, picked by the
 * surface it sits on. They exist so the surface rule is structural rather than
 * a convention four separate class-strings each had to remember:
 *
 *   **cloud** (`#F7F5EE`) — hover recolours to `brick`, which measures 4.78:1
 *   there and clears AA.
 *   **frost** (`#DCE3EA`) — hover underlines instead. `brick` on frost measures
 *   **4.03:1** and fails AA, so it must never be the hover on this surface;
 *   thickening an underline signals the same thing and costs no contrast.
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
export const LINK_ON_CLOUD = `text-pine hover:text-brick ${FOCUS_RING}`

/** Links on `frost`. Underline hover — never brick. */
export const LINK_ON_FROST =
  'text-pine hover:underline hover:decoration-2 hover:underline-offset-4 ' +
  FOCUS_RING

type ExternalLinkProps = {
  href: string
  children: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>

/* -------------------------------------------------------------------------- */
/* Same-site vs. genuinely external                                           */
/* -------------------------------------------------------------------------- */

/**
 * The club's own domain. Everything in `src/lib/links.ts` is either a page on
 * it (the three nav destinations, the eight footer pages, the resources archive
 * and the mailing-list form) or a third-party service (Discord, GitHub,
 * LinkedIn, Facebook, Twitter). One hostname test separates the two.
 */
const SITE_HOSTNAME = 'hackbu.org'

/**
 * True for a destination on hackbu.org or any subdomain of it.
 *
 * The rule is the *hostname*, not a string prefix, so it cannot be fooled by
 * `https://hackbu.org.example.com/` (hostname `hackbu.org.example.com`, which
 * neither equals `hackbu.org` nor ends with `.hackbu.org`) and it does not care
 * about scheme, port, path or query. A relative href resolves against the site
 * origin and is therefore same-site by construction. Anything `new URL` cannot
 * parse is treated as external — the conservative answer, since that is the
 * branch that keeps `rel="noopener noreferrer"`.
 */
function isSameSite(href: string): boolean {
  let url: URL
  try {
    url = new URL(href, `https://${SITE_HOSTNAME}`)
  } catch {
    return false
  }
  return (
    url.hostname === SITE_HOSTNAME || url.hostname.endsWith(`.${SITE_HOSTNAME}`)
  )
}

/**
 * Every off-site link on the page goes through here so the new-tab + rel
 * hardening can never be forgotten. mailto: links use MailLink instead — a
 * mail client should not open in a throwaway browser tab.
 *
 * Two behaviours, picked by `isSameSite(href)` and by nothing else:
 *
 *   **hackbu.org** — navigates in place. No `target`, no notice. Eight footer
 *   pages, three nav destinations, the resources archive and the mailing-list
 *   form are all the club's own site; a new tab for them buys nothing and
 *   leaves the reader with a pile of windows onto one site (P4-1).
 *
 *   **everything else** — keeps `target="_blank"` with the `rel` hardening,
 *   and now says so. WCAG technique G201 asks that a new window be announced
 *   in advance; the visually-hidden span does that for a screen-reader or
 *   magnifier user, and appends to the link's accessible name ("Discord, opens
 *   in a new tab") rather than replacing it, so the visible text and the
 *   announced text still match (2.5.3 Label in Name).
 *
 * `{...rest}` stays first so a caller cannot overwrite `href`, `target` or
 * `rel` — the hardening is not overridable by a prop, which is the point of
 * routing every link through one component.
 */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  if (isSameSite(href)) {
    return (
      <a {...rest} href={href}>
        {children}
      </a>
    )
  }

  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
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
