/**
 * Every off-site URL the page points at, in one place.
 *
 * These are the canonical live URLs taken from hackbu.org — later phases should
 * reuse these constants rather than re-typing hrefs.
 */

export const DISCORD_URL = 'https://discord.gg/Xka5uUh'
export const CONTACT_EMAIL = 'hello@hackbu.org'
export const RESOURCES_URL = 'https://hackbu.org/resources'

/** The redesigned schedule page on this deployment. */
export const SCHEDULE_URL = '/schedule'

/** Google Calendar subscription for HackBU events (from hackbu.org/schedule). */
export const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/u/0?cid=Y19tanExdmltam8yb2ZvZm1vZWZwZnJpMDNlNEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t'

/** iCalendar feed for other calendar apps (from hackbu.org/schedule). */
export const ICAL_URL =
  'https://calendar.google.com/calendar/ical/c_mjq1vimjo2ofofmoefpfri03e4%40group.calendar.google.com/public/basic.ics'

/** The mailing-list / interest-form signup. */
export const MAILING_LIST_URL = 'https://hackbu.org/mailing-list'

/** In-site About us page. Clean URL; Vite and Vercel rewrite it to about.html. */
export const ABOUT_PATH = '/about'

/** In-site Sponsors page. Clean URL; Vite and Vercel rewrite it to sponsors.html. */
export const SPONSORS_PATH = '/sponsors'

/** Header nav destinations (the Discord CTA is separate). */
export const NAV_LINKS = [
  { label: 'About Us', href: ABOUT_PATH },
  { label: 'Schedule', href: SCHEDULE_URL },
  { label: 'Sponsors', href: SPONSORS_PATH },
  { label: 'Resources', href: RESOURCES_URL },
  { label: 'Hackathons', href: 'https://hackbu.org/hackathons' },
] as const

/** All eight existing hackbu.org pages, split into two footer columns. */
export const SITE_PAGES = [
  { label: 'Schedule', href: SCHEDULE_URL },
  { label: 'Resources', href: RESOURCES_URL },
  { label: 'Hackathons', href: 'https://hackbu.org/hackathons' },
  { label: 'Registration', href: 'https://hackbu.org/registration' },
  { label: 'Blog', href: 'https://hackbu.org/blog' },
  { label: 'Photos', href: 'https://hackbu.org/photos' },
  { label: 'Organizers', href: 'https://hackbu.org/organizers' },
  { label: 'Sponsors', href: SPONSORS_PATH },
] as const

export const SOCIAL_LINKS = [
  { label: 'Discord', href: DISCORD_URL },
  { label: 'GitHub', href: 'https://github.com/HackBinghamton/HackBU' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/groups/8427110' },
  { label: 'Facebook', href: 'https://www.facebook.com/HackBinghamton' },
  { label: 'Twitter', href: 'https://twitter.com/HackBinghamton' },
] as const
