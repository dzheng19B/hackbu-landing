/**
 * Every off-site URL the page points at, in one place.
 *
 * These are the canonical live URLs taken from hackbu.org — later phases should
 * reuse these constants rather than re-typing hrefs.
 */

export const DISCORD_URL = 'https://discord.gg/Xka5uUh'
export const CONTACT_EMAIL = 'hello@hackbu.org'
export const RESOURCES_URL = 'https://hackbu.org/resources'

/** The mailing-list / interest-form signup. */
export const MAILING_LIST_URL = 'https://hackbu.org/mailing-list'

/** In-site About us page. Clean URL; Vite and Vercel rewrite it to about.html. */
export const ABOUT_PATH = '/about'

/** Header nav destinations (the Discord CTA is separate). */
export const NAV_LINKS = [
  { label: 'About Us', href: ABOUT_PATH },
  { label: 'Schedule', href: 'https://hackbu.org/schedule' },
  { label: 'Resources', href: 'https://hackbu.org/resources' },
  { label: 'Hackathons', href: 'https://hackbu.org/hackathons' },
] as const

/** All eight existing hackbu.org pages, split into two footer columns. */
export const SITE_PAGES = [
  { label: 'Schedule', href: 'https://hackbu.org/schedule' },
  { label: 'Resources', href: 'https://hackbu.org/resources' },
  { label: 'Hackathons', href: 'https://hackbu.org/hackathons' },
  { label: 'Registration', href: 'https://hackbu.org/registration' },
  { label: 'Blog', href: 'https://hackbu.org/blog' },
  { label: 'Photos', href: 'https://hackbu.org/photos' },
  { label: 'Organizers', href: 'https://hackbu.org/organizers' },
  { label: 'Sponsors', href: 'https://hackbu.org/sponsors' },
] as const

export const SOCIAL_LINKS = [
  { label: 'Discord', href: DISCORD_URL },
  { label: 'GitHub', href: 'https://github.com/HackBinghamton/HackBU' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/groups/8427110' },
  { label: 'Facebook', href: 'https://www.facebook.com/HackBinghamton' },
  { label: 'Twitter', href: 'https://twitter.com/HackBinghamton' },
] as const
