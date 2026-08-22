import { createContext, useContext } from 'react'
import { cubicBezier, useReducedMotion, type MotionValue } from 'motion/react'

/**
 * Project-wide motion conventions.
 *
 * Every animated component in this project imports from here rather than
 * reaching for `motion/react` primitives directly, so that two things are
 * defined exactly once:
 *
 *   1. what "reduced motion" means      -> usePrefersReducedMotion()
 *   2. where the hero's scroll progress -> HeroScrollContext / useHeroScroll()
 *      comes from
 *
 * Phase 3 establishes both. Phase 4 (cloud parallax) and Phase 5 (section
 * reveals) are expected to consume them, not re-derive them.
 */

/* -------------------------------------------------------------------------- */
/* Reduced motion                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `prefers-reduced-motion: reduce`, as a definite boolean.
 *
 * motion's own `useReducedMotion()` returns `boolean | null` (`null` when
 * there is no `window` to query). Normalising that here means callers never
 * have to think about the third state.
 *
 * **The convention:** any component that animates calls this hook, and when it
 * returns `true` renders its *resting* state — the frame the animation would
 * finish on — with no scroll-linked and no time-linked movement. It is not
 * enough to freeze the animation; a component that buys scroll distance (a
 * tall track, a pinned stage) must also give that distance back, or a
 * reduced-motion user is stranded in dead scroll space. See `Hero.tsx`, which
 * collapses its 260dvh track to a single viewport.
 *
 * Note: motion reads the media query once at mount and does not re-subscribe,
 * so a mid-session OS change takes effect on the next page load.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false
}

/* -------------------------------------------------------------------------- */
/* Shared easing + helpers                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The hero pan's easing curve: eases in and out only gently, because the
 * user's own scrolling supplies the timing. Anything steeper reads as the
 * image lagging behind the finger.
 */
export const HERO_PAN_EASE = cubicBezier(0.4, 0, 0.35, 1)

/**
 * Clamp to the 0..1 range. Module-private: `rangeProgress` is the only thing
 * that needs it, and every consumer of this module wants a window, not a clamp.
 */
function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/**
 * Progress of `value` through the `[from, to]` window, clamped to 0..1.
 * Used to carve sub-ranges out of a single 0..1 scroll progress.
 */
export function rangeProgress(value: number, from: number, to: number): number {
  return clamp01((value - from) / (to - from))
}

/* -------------------------------------------------------------------------- */
/* Hero scroll progress                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The hero's scroll state, published by `<Hero>` for anything rendered inside
 * its sticky stage.
 */
export type HeroScroll = {
  /**
   * Raw 0 -> 1 progress across the hero's scroll track. 0 is the top of the
   * page; 1 is the moment the sticky stage unpins and the hero starts
   * scrolling away.
   *
   * This is raw track progress, not the pan's own eased progress. <Hero>
   * derives the latter for the campus scale and keeps it to itself: the only
   * thing inside the stage is <HeroClouds>, which has to keep lifting and
   * fading through the tail of the track *after* the pan has finished, so raw
   * progress is the value it wants. Publishing an eased `pan` alongside it
   * would be a second source of truth with no reader.
   */
  progress: MotionValue<number>
  /**
   * Mirrors `usePrefersReducedMotion()`. When true, consumers must render
   * their resting frame and not animate at all — including against
   * `progress`, which still tracks scroll either way. (<Hero> collapses its
   * track to one viewport in that branch, so there is barely any left to
   * track.)
   */
  reducedMotion: boolean
}

/**
 * Phase 4's cloud layers mount inside the hero stage and read this instead of
 * calling `useScroll` again — one scroll subscription, one source of truth,
 * and no chance of the clouds and the campus disagreeing about progress.
 */
export const HeroScrollContext = createContext<HeroScroll | null>(null)

/** Read the hero's scroll state. Only valid inside the hero stage. */
export function useHeroScroll(): HeroScroll {
  const heroScroll = useContext(HeroScrollContext)
  if (!heroScroll) {
    throw new Error('useHeroScroll() must be called inside the <Hero> stage.')
  }
  return heroScroll
}
