import { Eyebrow, Section, SectionHeader } from '../../Layout'
import { ExternalLink, LINK_ON_CLOUD } from '../../ExternalLink'
import { Reveal, RevealGroup, RevealItem } from '../../Reveal'
import { GOOGLE_CALENDAR_URL, ICAL_URL } from '../../../lib/links'

const LINK_CLASSES =
  'font-display text-display-md font-semibold underline underline-offset-8 ' +
  LINK_ON_CLOUD

export function CalendarSection() {
  return (
    <Section id="calendar" labelledBy="calendar-title" className="bg-cloud">
      <Reveal>
        <SectionHeader
          eyebrow="Add to your calendar"
          titleId="calendar-title"
          title="Stay up to date on our events."
          lede="We provide an iCalendar link you can add to your calendar. Times and locations may change; check the feed for the latest."
        />
      </Reveal>

      <RevealGroup className="mt-12 grid gap-10 sm:grid-cols-2">
        <RevealItem>
          <Eyebrow>Google Calendar</Eyebrow>
          <ExternalLink
            href={GOOGLE_CALENDAR_URL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            For Google Calendar
          </ExternalLink>
          <p className="text-caption text-pine/90 mt-4">
            Adds the HackBU calendar to your Google account.
          </p>
        </RevealItem>

        <RevealItem>
          <Eyebrow>Other calendar apps</Eyebrow>
          <ExternalLink
            href={ICAL_URL}
            className={`${LINK_CLASSES} mt-4 inline-block`}
          >
            For other calendars
          </ExternalLink>
          <p className="text-caption text-pine/90 mt-4">
            Works with Apple Calendar, Outlook, and other apps that take an .ics
            link.
          </p>
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}
