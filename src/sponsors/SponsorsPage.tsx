import { domAnimation, LazyMotion } from 'motion/react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { SnowdriftDivider } from '../components/SnowdriftDivider'
import { Eyebrow, Section } from '../components/Layout'
import { Reveal } from '../components/Reveal'
import { MailLink, LINK_ON_CLOUD } from '../components/ExternalLink'
import { CONTACT_EMAIL, SPONSORS_PATH } from '../lib/links'
import { SPONSORS_PHOTO } from '../lib/images'

const EMAIL_LINK = `${LINK_ON_CLOUD} underline underline-offset-4`

const PHOTO =
  'mx-auto aspect-[4/3] w-full max-w-sm md:max-w-none md:aspect-[3/4] lg:aspect-[4/5]'

/**
 * Sponsors — why to partner with HackBU and how to get the sponsorship packet.
 *
 * One `<LazyMotion features={domAnimation} strict>` around the whole tree, for
 * the reason written out in `src/App.tsx` and `src/about/AboutPage.tsx`: the
 * `<Reveal>`s render `m.*`, which need a provider, and the wrapper sits inside
 * this component so `renderSponsors()` in `src/entry-server.tsx` renders the
 * same tree the client hydrates.
 */
export function SponsorsPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="bg-cloud font-sans text-pine min-h-screen">
        <a
          href="#main"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to content
        </a>

        <SiteHeader homeHref="/" currentHref={SPONSORS_PATH} />

        <main id="main" className="pt-16 sm:pt-20">
          <Section id="sponsors" labelledBy="sponsors-title" className="bg-cloud">
            <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_24rem] lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-14">
              <Reveal>
                <div className="max-w-2xl">
                  <Eyebrow>Sponsors</Eyebrow>
                  <h1
                    id="sponsors-title"
                    className="font-display text-display-lg text-pine mt-4 font-semibold text-balance"
                  >
                    Partner with HackBU.
                  </h1>
                  <p className="text-lede text-pine mt-5">
                    Sponsoring a hackathon is a powerful way to recruit, build your
                    platform&apos;s reputation among young developers, or help get
                    people building on top of your technology.
                  </p>
                  <p className="text-body text-pine mt-5">
                    Want to support HackBU at Binghamton University? We&apos;re
                    looking to help you hire, and to make our events as awesome as
                    they can be.
                  </p>
                  <p className="text-body text-pine mt-5">
                    We have a sponsorship packet available; contact{' '}
                    <MailLink email={CONTACT_EMAIL} className={EMAIL_LINK}>
                      {CONTACT_EMAIL}
                    </MailLink>{' '}
                    to learn more.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <SponsorsPhoto photo={SPONSORS_PHOTO} className={PHOTO} />
              </Reveal>
            </div>
          </Section>
        </main>

        <SnowdriftDivider variant="cloud-to-frost" />
        <SiteFooter />
      </div>
    </LazyMotion>
  )
}

function SponsorsPhoto({
  photo,
  className = '',
}: {
  photo: typeof SPONSORS_PHOTO
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
          className="h-full w-full object-cover"
        />
      </picture>
    </figure>
  )
}
