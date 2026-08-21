/**
 * The HackBU wordmark. "BU" carries the single brick accent so the club name
 * reads as Binghamton's, without introducing a second hue.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display text-pine font-semibold tracking-tight ${className}`}
    >
      Hack<span className="text-brick">BU</span>
    </span>
  )
}
