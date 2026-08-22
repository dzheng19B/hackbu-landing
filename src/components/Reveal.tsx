import type { ReactNode } from 'react'
import { cubicBezier, motion, type MotionProps } from 'motion/react'
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
 * when it returns true every component below drops its motion props entirely.
 * With no `initial` and no variants to inherit, the element paints at its
 * resting state on the first frame — there is no animation to skip, shorten or
 * wait out.
 */

/** Travel distance of the upward translate, in px. Deliberately small. */
const DISTANCE = 16

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
    ? {}
    : {
        initial: { opacity: 0, y: DISTANCE },
        whileInView: { opacity: 1, y: 0 },
        viewport: VIEWPORT,
        transition: { ...ITEM_TRANSITION, delay },
      }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
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
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport: VIEWPORT,
        variants: GROUP_VARIANTS,
      }

  if (as === 'ul') {
    return (
      <motion.ul className={className} {...motionProps}>
        {children}
      </motion.ul>
    )
  }

  if (as === 'dl') {
    return (
      <motion.dl className={className} {...motionProps}>
        {children}
      </motion.dl>
    )
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
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
    ? {}
    : { variants: ITEM_VARIANTS }

  if (as === 'li') {
    return (
      <motion.li className={className} {...motionProps}>
        {children}
      </motion.li>
    )
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  )
}
