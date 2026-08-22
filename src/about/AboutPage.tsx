import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section, SectionHeader } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { ExternalLink, LINK_ON_CLOUD } from '../components/ExternalLink'
import { ABOUT_PATH, RESOURCES_URL } from '../lib/links'
import { ABOUT_PHOTOS } from '../lib/images'

/**
 * About us — one topic per section, separated by snowdrifts the same way
 * the landing page is. Photos sit beside the copy they illustrate
 * (~24–28rem from `md` up).
 */

const RESOURCES_LINK = `${LINK_ON_CLOUD} underline underline-offset-4`

const PHOTO =
  'mx-auto aspect-[4/3] w-full max-w-sm md:max-w-none md:aspect-[3/4] lg:aspect-[4/5]'

export function AboutPage() {
  return (
    <div className="bg-cloud font-sans text-pine min-h-screen">
      <a
        href="#main"
        className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
      >
        Skip to content
      </a>

      <SiteHeader currentHref={ABOUT_PATH} />

      <main id="main" className="pt-16 sm:pt-20">
        <Section id="about" labelledBy="about-page-title" className="bg-cloud">
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_24rem] lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-14">
            <Reveal>
              <header>
                <Eyebrow>About Us</Eyebrow>
                <h1
                  id="about-page-title"
                  className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
                >
                  HackBU exists to foster a community of individuals who solve
                  problems through the innovative use of technology.
                </h1>
                <p className="text-lede text-pine mt-5">
                  We host weekly development workshops and hold our own
                  hackathon yearly.
                </p>
              </header>
            </Reveal>

            <Reveal delay={0.1}>
              <AboutPhoto photo={ABOUT_PHOTOS.collaborate} className={PHOTO} />
            </Reveal>
          </div>
        </Section>

        <SnowdriftDivider variant="drift-a" />

        <Section id="workshops" labelledBy="workshops-title" className="bg-cloud">
          <div className="grid items-center gap-10 md:grid-cols-[24rem_minmax(0,1fr)] lg:grid-cols-[28rem_minmax(0,1fr)] lg:gap-14">
            <Reveal>
              <AboutPhoto
                photo={ABOUT_PHOTOS.table}
                lazy
                className={PHOTO}
              />
            </Reveal>

            <Reveal delay={0.1}>
              <SectionHeader
                eyebrow="Every week"
                titleId="workshops-title"
                title="Workshops on campus for web and mobile development."
                lede="You’ll learn at your own pace, and we’ll provide the resources to help you do it. We’re there to answer questions, help you work through tough problems, and generally around to get you pumped up about learning to code."
              />
            </Reveal>
          </div>
        </Section>

        <SnowdriftDivider variant="drift-b" />

        <Section
          id="hackathon"
          labelledBy="hackathon-title"
          className="bg-cloud"
        >
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_24rem] lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-14">
            <Reveal>
              <SectionHeader
                eyebrow="Every year"
                titleId="hackathon-title"
                title="Hackers from all over the Northeast"
                lede="HackBU brings together collegiate students to collaborate on innovative projects, discover new technologies, network with recruiters, and compete for prizes."
              />
            </Reveal>

            <Reveal delay={0.1}>
              <AboutPhoto
                photo={ABOUT_PHOTOS.hackathon}
                lazy
                className={PHOTO}
              />
            </Reveal>
          </div>
        </Section>

        <SnowdriftDivider variant="drift-c" />

        <Section
          id="getting-started"
          labelledBy="getting-started-title"
          className="bg-cloud"
        >
          <Reveal>
            <SectionHeader
              eyebrow="Getting started"
              titleId="getting-started-title"
              title="Experience isn’t necessary."
              lede="Many HackBU members have no programming experience."
            />
            <p className="text-lede text-pine mt-5 max-w-2xl">
              We recommend attending our weekly workshops, but also take a look
              at our{' '}
              <ExternalLink href={RESOURCES_URL} className={RESOURCES_LINK}>
                resources page
              </ExternalLink>{' '}
              which will point you in the right direction. We’re happy to help!
            </p>
          </Reveal>
        </Section>
      </main>

      <SnowdriftDivider variant="cloud-to-frost" />
      <SiteFooter />
    </div>
  )
}

function AboutPhoto({
  photo,
  lazy = false,
  className = '',
}: {
  photo: (typeof ABOUT_PHOTOS)[keyof typeof ABOUT_PHOTOS]
  lazy?: boolean
  className?: string
}) {
  return (
    <figure
      className={`border-frost overflow-hidden rounded-2xl border ${className}`}
    >
      <picture>
        <source type="image/avif" srcSet={photo.avif} />
        <source type="image/webp" srcSet={photo.webp} />
        <img
          src={photo.jpg}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          decoding="async"
          loading={lazy ? 'lazy' : undefined}
          className="h-full w-full object-cover"
        />
      </picture>
    </figure>
  )
}
