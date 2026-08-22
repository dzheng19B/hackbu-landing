import { useState } from 'react'
import { domAnimation, LazyMotion } from 'motion/react'
import { Column } from './kit'
import { LINK_ON_FROST } from '../components/ExternalLink'
import { TOGGLE_ON_CLOUD } from '../components/controls'
import { TokensPart } from './parts/TokensPart'
import { PrimitivesPart } from './parts/PrimitivesPart'
import { ComposedPart } from './parts/ComposedPart'
import { HeroPart } from './parts/HeroPart'

/**
 * The HackBU component sheet.
 *
 * Every component on this page is imported from `src/components/` and rendered
 * for real — there is no copied markup anywhere in `src/sheet/`, so the sheet
 * cannot drift out of date with the page. What the sheet adds is the frame
 * around each specimen: the file path, the props as written, and the rule the
 * component encodes.
 *
 * It builds as a second Vite entry (components.html) and deploys beside the
 * landing page at /components. Its code is not in the landing page's bundle.
 *
 * The <LazyMotion features={domAnimation} strict> below mirrors src/App.tsx's:
 * the specimens are the real components, which render `m.*` elements and take
 * their feature set from a provider rather than carrying one. Without it the
 * reveals in Part 2 would throw. See P5-2 for why the components use `m.*`.
 */

const PARTS = [
  {
    id: 'tokens',
    label: 'Tokens',
    title: 'Design tokens',
    blurb: 'The nine colours and the seven type steps, at size.',
  },
  {
    id: 'primitives',
    label: 'Primitives',
    title: 'Primitives in isolation',
    blurb: 'Every standalone component, with every variant it has.',
  },
  {
    id: 'composed',
    label: 'Composed',
    title: 'Composed, as used',
    blurb: 'The header, the five sections and the footer, as the page renders them.',
  },
  {
    id: 'hero',
    label: 'Hero',
    title: 'The hero',
    blurb: 'Documented rather than embedded — it is a scroll track, not a block.',
  },
] as const

type RevealMode = 'resting' | 'scroll'

export function ComponentSheet() {
  /**
   * Reveals default to their resting frame. See the comment in sheet.css: a
   * catalogue whose contents are waiting on an IntersectionObserver is a
   * catalogue that can show you nothing, and the sheet is read in exactly the
   * conditions where that observer does not fire.
   */
  const [reveals, setReveals] = useState<RevealMode>('resting')

  return (
    <LazyMotion features={domAnimation} strict>
      <div data-reveals={reveals} className="bg-cloud text-pine font-sans min-h-screen">
        <a
          href="#tokens"
          className="bg-cloud text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:px-4 focus:py-2 focus:outline-2"
        >
          Skip to the sheet
        </a>

        <Masthead />

        <nav
          aria-label="Sheet sections"
          className="bg-cloud border-frost sticky top-0 z-50 border-y"
        >
          <Column className="flex h-14 items-center justify-between gap-4">
            <ul className="-mx-2 flex min-w-0 items-center gap-1 overflow-x-auto px-2">
              {PARTS.map((part) => (
                <li key={part.id}>
                  <a
                    href={`#${part.id}`}
                    className="text-caption text-pine hover:text-brick focus-visible:outline-pine block rounded-full px-3 py-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {part.label}
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              aria-pressed={reveals === 'scroll'}
              onClick={() =>
                setReveals((mode) => (mode === 'resting' ? 'scroll' : 'resting'))
              }
              className={`${TOGGLE_ON_CLOUD} text-caption shrink-0 rounded-full px-3 py-1.5`}
            >
              Reveals:{' '}
              <span className="font-medium">
                {reveals === 'resting' ? 'at rest' : 'on scroll'}
              </span>
            </button>
          </Column>
        </nav>

        <main>
          <TokensPart />
          <PrimitivesPart revealsAnimate={reveals === 'scroll'} />
          <ComposedPart />
          <HeroPart />
        </main>

        <footer className="border-frost bg-frost border-t">
          <Column className="py-10">
            <p className="text-caption text-pine/90">
              Generated from the components themselves — every specimen above is
              the real component, imported and rendered. Update a component and
              this page updates with it; only the prose around it is written by
              hand.
            </p>
            <p className="text-caption text-pine/90 mt-3">
              {/* This footer band is frost, so it takes the frost treatment —
                  the same rule the sheet documents in Part 2. */}
              <a href="/" className={LINK_ON_FROST}>
                Back to the landing page
              </a>
            </p>
          </Column>
        </footer>
      </div>
    </LazyMotion>
  )
}

function Masthead() {
  return (
    <header className="bg-cloud">
      <Column className="py-14 sm:py-20">
        <p className="text-eyebrow text-pine/90 font-medium uppercase">
          Internal · not linked from the site
        </p>
        <h1 className="font-display text-display-xl text-pine mt-4 font-semibold text-balance">
          The HackBU component sheet.
        </h1>
        <p className="text-lede text-pine mt-6 max-w-2xl">
          Every component in the landing page in one place: the tokens they are
          built from, each primitive in isolation with all of its variants, and
          the composed pieces exactly as the page renders them.
        </p>

        <ol className="border-frost mt-12 border-t">
          {PARTS.map((part, index) => (
            <li key={part.id} className="border-frost border-b">
              <a
                href={`#${part.id}`}
                className="focus-visible:outline-pine group flex flex-col gap-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="text-eyebrow text-pine/90 font-medium uppercase sm:w-16 sm:shrink-0">
                  Part {index + 1}
                </span>
                <span className="text-body text-pine group-hover:text-brick font-medium sm:w-56 sm:shrink-0">
                  {part.title}
                </span>
                <span className="text-caption text-pine/90">{part.blurb}</span>
              </a>
            </li>
          ))}
        </ol>
      </Column>
    </header>
  )
}
