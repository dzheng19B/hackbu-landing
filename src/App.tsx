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
 * Order is: fixed header -> the hero's scroll track -> four content sections on
 * cloud, separated by snowdrift dividers -> footer on frost.
 *
 * The hero is illustration only. <AboutSection> directly under it is the
 * page's masthead and carries the only <h1>.
 *
 * The hero is the only element the scroll work touches; see
 * src/components/Hero.tsx for its layer contract.
 */
export default function App() {
  return (
    <div className="bg-cloud font-sans text-pine min-h-screen">
      <a
        href="#main"
        className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <Hero />

        {/*
         * A `drift-*` variant, not a sky-backed one. The divider is only ever
         * *seen* after the stage unpins, i.e. after the pan has finished, and
         * the finished frame ends on the snowy foreground plaza: the bottom 20
         * rows of Campus.png average #ccc3ad, a warm sand-grey. A saturated
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
  )
}
