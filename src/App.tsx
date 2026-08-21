import { SiteHeader } from './components/SiteHeader'
import { Hero } from './components/Hero'
import { SnowdriftDivider } from './components/SnowdriftDivider'
import { AboutSection } from './components/sections/AboutSection'
import { GetInvolvedSection } from './components/sections/GetInvolvedSection'
import { QuestionsSection } from './components/sections/QuestionsSection'
import { ContactSection } from './components/sections/ContactSection'
import { SiteFooter } from './components/SiteFooter'

/**
 * Page shell (Phase 2).
 *
 * Order is: fixed header -> 100dvh hero -> four content sections on cloud,
 * separated by snowdrift dividers -> footer on frost.
 *
 * The hero is the only element the scroll work in Phases 3-4 needs to touch;
 * see src/components/Hero.tsx for its layer contract.
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

        <SnowdriftDivider variant="sky-to-cloud" />
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
