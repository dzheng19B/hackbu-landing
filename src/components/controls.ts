/* -------------------------------------------------------------------------- */
/* Shared control treatments (non-link)                                       */
/* -------------------------------------------------------------------------- */

/**
 * The bordered pill toggle, on `cloud`.
 *
 * `LINK_ON_CLOUD` / `LINK_ON_FROST` in `ExternalLink.tsx` cover every *link* on
 * the page and `ButtonLink.tsx` covers the one solid button, which left one
 * shape with no home: a small outlined `<button>` on the cloud background. It
 * had been written inline in three files (the header's menu toggle and two
 * controls on the component sheet), all three carrying the same treatment fragment
 * (only their sizing utilities differed) and none of them documented — see P3-1.
 *
 * What was wrong with it, not just where it lived: the border and the hover
 * fill were both `frost`, which measures **1.19:1** against `cloud`. A boundary
 * and a hover state that no sighted user can see (P4-2). This constant moves
 * both to `pine`:
 *
 *   border   `pine` on `cloud` — **6.83:1**, clearing the 3:1 of WCAG 1.4.11
 *            (Non-text Contrast) with room to spare, so the control now has a
 *            visible edge rather than one that only exists in the source.
 *   hover    fills with `pine` and flips the glyph/label to `cloud` — the fill
 *            separates from the page at the same 6.83:1, and `cloud` on `pine`
 *            is 6.83:1 for the content inside it.
 *
 * `pine` and not `brick`: `brick` is the page's single accent and means "join
 * the Discord" (see `ButtonLink.tsx`). A menu toggle is navigation furniture,
 * not the conversion action, so it takes the same pine that already carries
 * every focus ring and the button's own hover fill. `stone` was the other
 * candidate and cannot be used — it measures 1.81:1 on `cloud`, below the 3:1
 * bar this constant exists to clear.
 *
 * Carried verbatim from the inline strings: the pine focus ring at offset 2.
 * Not here, deliberately, and left to the call site: shape and size — radius,
 * padding, text step — exactly as `LINK_ON_CLOUD` leaves typography out. What
 * this fixes is only the part that has a contrast answer.
 */
export const TOGGLE_ON_CLOUD =
  'border border-pine text-pine hover:bg-pine hover:text-cloud ' +
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2'
