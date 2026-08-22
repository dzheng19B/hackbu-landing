import { BEARCAT_MARK, WORDMARK_MARK } from '../lib/images'

/**
 * The HackBU logo lockup: the bearcat mark beside the HACKBU wordmark.
 *
 * Both marks are **masked elements, not images**. Each `<span>` is painted in
 * the `fern` token and has its shape cut out of it by a mask derivative from
 * `public/brand/` — see the `.brand-mark-*` rules in src/index.css for why, and
 * `scripts/generate-images.mjs` for how the derivatives are made. The upshot
 * here is that the two source marks, which ship in two different greens, come
 * out of this component in one.
 *
 * **Sizing.** The marks are sized in `em`, so the lockup scales with its own
 * font-size and the call sites keep setting the size the way they did when this
 * was literal text — `text-2xl` in the footer, `text-2xl sm:text-3xl` in the
 * header. Widths come from `aspect-ratio` against the trimmed ink boxes, so
 * neither mark can be stretched by a stray width.
 *
 * At the two sizes actually used:
 *
 *     text-2xl (16px em -> 24px)   bearcat 30.0 x 28.6   wordmark 17.3 x 123.0
 *     text-3xl (          30px)    bearcat 37.5 x 35.7   wordmark 21.6 x 153.8
 *
 * The taller of those, 37.5px, sits inside the `sm` header's 80px bar with room
 * to spare, and the whole `sm` lockup is 199px wide.
 *
 * **Accessibility.** The two marks are one logo, not two graphics: the wrapper
 * carries `role="img"` with an "HackBU" label, which makes the children
 * presentational, so a screen reader announces the lockup once, as the club's
 * name. In the header that label is also what names the link wrapping it, which
 * would otherwise have no accessible name at all — the marks are empty
 * elements with no text to fall back on.
 */

/** Ratio of the bearcat's height to the lockup's font-size. */
const BEARCAT_EM = 1.25
/** Ratio of the wordmark's height to the lockup's font-size. */
const WORDMARK_EM = 0.72

function aspect(mark: { width: number; height: number }) {
  return `${mark.width} / ${mark.height}`
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="HackBU"
      className={`flex w-fit items-center gap-[0.34em] ${className}`}
    >
      <span
        className="brand-mark brand-mark-bearcat bg-fern block"
        style={{ height: `${BEARCAT_EM}em`, aspectRatio: aspect(BEARCAT_MARK) }}
      />
      <span
        className="brand-mark brand-mark-wordmark bg-fern block"
        style={{ height: `${WORDMARK_EM}em`, aspectRatio: aspect(WORDMARK_MARK) }}
      />
    </span>
  )
}
