import type { ReactNode } from 'react'
import { cubicBezier, m, type MotionProps } from 'motion/react'
import { usePrefersReducedMotion } from '../lib/motion'

/**
 * Scroll-triggered entrance reveals for the four content sections.
 *
 * One shape only: fade in from a short upward translate, once, when the
 * element first enters the viewport. Nothing here is scroll-scrubbed and
 * nothing reverses on the way back up — `viewport={{ once: true }}` retires
 * the observer after the first crossing.
 *
 * Only `opacity` and `transform` are animated (motion compiles `y` to
 * `translateY`), so a reveal never triggers layout.
 *
 *   <Reveal>            standalone block — headers, single cards
 *   <RevealGroup>       orchestrates its children, staggered
 *     <RevealItem>      one member of a group
 *
 * Reduced motion: `usePrefersReducedMotion()` is the project convention, and
 * when it returns true every component below animates to `REST` with a zero
 * duration instead of hiding and fading up.
 *
 * **Why `animate: REST` and not simply dropping the motion props.** That is
 * what this file used to do, and it left reduced-motion visitors looking at
 * blank sections. The hook is deliberately gated on having mounted (see
 * `src/lib/motion.ts`), so the *first* render — the one the server produced and
 * the one hydration has to match — always takes the full-motion branch and
 * writes `opacity: 0; transform: translateY(16px)` onto every wrapper.
 * `usePrefersReducedMotion()` only flips to `true` in the layout effect after
 * that. Dropping the props on the second render removes nothing: `initial` is a
 * mount-time prop, so motion never revisits it, and the element keeps the
 * hidden inline style for the rest of the session — permanently, because the
 * `whileInView` trigger was removed along with everything else. Measured on the
 * built output: seven wrappers on `/about.html`, all at `opacity: 0`, none of
 * them ever revealed.
 *
 * `animate` *is* re-read when it changes, so handing it the resting frame is
 * what actually clears the hidden state. `duration: 0` makes it a set rather
 * than an animation, and the flip happens in a layout effect, so it lands in
 * the same frame as hydration and before the first paint: a reduced-motion
 * visitor sees the resting frame and never a step of the movement. motion
 * writes `transform: none` rather than `translateY(0px)` once every transform
 * channel is back at its default, so the resting frame is the same one an
 * unanimated element would have had.
 */

/** Travel distance of the upward translate, in px. Deliberately small. */
const DISTANCE = 16

/**
 * The frame every reveal finishes on, and the frame a reduced-motion visitor
 * starts on. `duration: 0` because there is nothing to watch.
 */
const REST = { opacity: 1, y: 0 } as const
const REST_TRANSITION = { duration: 0 } as const

const EASE = cubicBezier(0.22, 0.61, 0.36, 1)
const DURATION = 0.55

/** Fires a little before the element is fully on screen. */
const VIEWPORT: MotionProps['viewport'] = { once: true, amount: 0.2 }

const ITEM_TRANSITION = { duration: DURATION, ease: EASE }

/**
 * Group parent. It has no visual state of its own — its only job is to hold
 * the timeline that its children's variants hang off, so items land one after
 * another instead of all at once.
 */
const GROUP_VARIANTS = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.05, staggerChildren: 0.12 },
  },
} as const

/** The resting/entrance pair every revealed element shares. */
const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: DISTANCE },
  visible: { opacity: 1, y: 0, transition: ITEM_TRANSITION },
} as const

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds to hold before this reveal starts. Groups use stagger instead. */
  delay?: number
}

/** A single block that fades up on its own when it scrolls into view. */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const motionProps: MotionProps = prefersReducedMotion
    ? { animate: REST, transition: REST_TRANSITION }
    : {
        initial: { opacity: 0, y: DISTANCE },
        whileInView: { opacity: 1, y: 0 },
        viewport: VIEWPORT,
        transition: { ...ITEM_TRANSITION, delay },
      }

  return (
    <m.div className={className} {...motionProps}>
      {children}
    </m.div>
  )
}

/**
 * Wraps a list of `<RevealItem>`s and staggers them. Renders as the tag the
 * content actually needs so the reveal never costs the markup its semantics.
 */
export function RevealGroup({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'dl'
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const motionProps: MotionProps = prefersReducedMotion
    ? { animate: REST, transition: REST_TRANSITION }
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: VIEWPORT,
        variants: GROUP_VARIANTS,
      }

  if (as === 'ul') {
    return (
      <m.ul className={className} {...motionProps}>
        {children}
      </m.ul>
    )
  }

  if (as === 'dl') {
    return (
      <m.dl className={className} {...motionProps}>
        {children}
      </m.dl>
    )
  }

  return (
    <m.div className={className} {...motionProps}>
      {children}
    </m.div>
  )
}

/**
 * One member of a `<RevealGroup>`. It carries no trigger of its own — the
 * group hands it `hidden`/`visible`, which is what makes the stagger possible.
 */
export function RevealItem({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li'
}) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const motionProps: MotionProps = prefersReducedMotion
    ? { animate: REST, transition: REST_TRANSITION }
    : { variants: ITEM_VARIANTS }

  if (as === 'li') {
    return (
      <m.li className={className} {...motionProps}>
        {children}
      </m.li>
    )
  }

  return (
    <m.div className={className} {...motionProps}>
      {children}
    </m.div>
  )
}
