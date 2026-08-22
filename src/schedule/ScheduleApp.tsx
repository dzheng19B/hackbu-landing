import { SiteHeader } from '../components/SiteHeader'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { SiteFooter } from '../components/SiteFooter'
import { ScheduleIntroSection } from '../components/sections/schedule/ScheduleIntroSection'
import { WorkshopDetailsSection } from '../components/sections/schedule/WorkshopDetailsSection'
import { CalendarSection } from '../components/sections/schedule/CalendarSection'
import { StayUpdatedSection } from '../components/sections/schedule/StayUpdatedSection'
import { SCHEDULE_URL } from '../lib/links'

/**
 * Schedule page: weekly workshops, calendar links, and how we announce events.
 */
export default function ScheduleApp() {
  return (
    <div id="top" className="bg-cloud font-sans text-pine min-h-screen">
      <a
        href="#main"
        className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
      >
        Skip to content
      </a>

      <SiteHeader homeHref="/" currentHref={SCHEDULE_URL} />

      <main id="main">
        <ScheduleIntroSection />

        <SnowdriftDivider variant="drift-a" />
        <WorkshopDetailsSection />

        <SnowdriftDivider variant="drift-b" />
        <CalendarSection />

        <SnowdriftDivider variant="drift-c" />
        <StayUpdatedSection />
      </main>

      <SnowdriftDivider variant="cloud-to-frost" />
      <SiteFooter />
    </div>
  )
}
