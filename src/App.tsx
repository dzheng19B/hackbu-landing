import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from './components/SiteHeader'
import { Hero } from './components/Hero'
import { SnowdriftDivider } from './components/SnowdriftDivider'
import { AboutSection } from './components/sections/AboutSection'
import { GetInvolvedSection } from './components/sections/GetInvolvedSection'
import { QuestionsSection } from './components/sections/QuestionsSection'
import { ContactSection } from './components/sections/ContactSection'
import { SiteFooter } from './components/SiteFooter'

/**
 * Page shell.
 *
 * Order is: fixed header -> the hero's scroll track -> five content sections on
 * cloud, separated by snowdrift dividers -> footer on frost.
 *
 * page's masthead and carries the only <h1>; it and <AboutSection> are one
 * uninterrupted stretch of cloud, so the drift between them would separate
 * nothing and there isn't one.
 *
 * The hero is the only element the scroll work touches; see
 * src/components/Hero.tsx for its layer contract.
 *
 * The whole tree sits inside one <LazyMotion features={domAnimation} strict>.
 * `motion.*` components carry motion's *whole* feature set with them — drag,
 * pan and layout projection included — which is ~50 KB of the shared chunk this
 * page uses none of: there is no drag, no `layout`/`layoutId`, no
 * <AnimatePresence> anywhere in `src/`. The `m.*` components carry no features
 * at all and take them from this provider instead, and `domAnimation` is
 * exactly animations + gestures — which is where `whileInView` lives, so the
 * section reveals still work. `strict` makes the saving enforceable rather than
 * conventional: rendering a `motion.*` component below this point throws, so
 * the full bundle cannot creep back in one component at a time. See P5-2.
 */
export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="#top" />

        {/*
         * `tabIndex={-1}` so the skip link above actually moves focus.
         *
         * Activating a fragment link whose target is not focusable moves only the
         * *sequential focus navigation starting point*: Chrome, Edge and Firefox
         * implement it, so the next Tab lands inside <main>, but Safari does not
         * unless Full Keyboard Access is on — where the skip link would silently
         * do nothing. -1 keeps the element out of the tab order and makes it a
         * real focus target (technique H69/G1). See P2-4.
         *
         * `focus:outline-none` is scoped to this element and to the hero's #top
         * for the same reason: both are only ever focused programmatically, by an
         * in-page anchor, and Chromium's :focus-visible heuristic *does* match
         * that — which would paint the UA's default ring around the entire page
         * content. Nothing else on the page suppresses an outline, and the two
         * elements this appears on carry no other focus treatment to lose.
         */}
        <main id="main" tabIndex={-1} className="focus:outline-none">
          <Hero />

          {/*
           * A `drift-*` variant, not a sky-backed one. The divider is only ever
           * *seen* after the stage unpins, i.e. after the pan has finished, and
           * the finished frame ends on the snowy foreground plaza: the bottom 20
           * rows of Campus.png average a warm sand-grey close to (but not the
           * same as) the `stone` token — a measured artwork colour, not a
           * design token, so it is not what the "no arbitrary hex" rule in
           * README's Conventions section is aimed at. A saturated
           * blue band under that would read as a stripe. (A `sky-to-cloud`
           * variant did exist for the hero boundary, from when the hero's bottom
           * edge was open sky. Nothing rendered it after this moved, and it has
           * since been removed.)
           *
           * The `drift-*` variants band `bg-frost` with cloud-coloured drifts top
           * and bottom, which under the plaza reads as a bank of settled snow
           * carrying the eye into the page — the thing the component was built to
           * do. `drift-c` specifically, so that its other use (questions ->
           * contact) is as far away as the page allows and no shape repeats in a
           * row.
           */}
          <SnowdriftDivider variant="drift-c" />
          <AboutSection />

          <SnowdriftDivider variant="drift-a" />
          <GetInvolvedSection />

          <SnowdriftDivider variant="drift-b" />
          <QuestionsSection />

          <SnowdriftDivider variant="drift-c" />
          <ContactSection />
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}
