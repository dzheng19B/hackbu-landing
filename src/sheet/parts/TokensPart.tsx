import { useEffect, useRef, useState, type RefObject } from 'react'
import { Block, Caption, Entry, Ground, Rule, SheetSection } from '../kit'

/**
 * Part 1 — the tokens themselves.
 *
 * Colours are drawn with the token utilities (`bg-sky`, `bg-fern`, ...), so a
 * swatch is the token, not a picture of it. Type steps are rendered at their
 * real size and then *measured* — the display steps are `clamp()` expressions,
 * so the only honest way to print a px value is to read it back off the
 * element at the current viewport width.
 */

/* -------------------------------------------------------------------------- */
/* Colour                                                                     */
/* -------------------------------------------------------------------------- */

type Flag = 'unused' | 'retired' | 'logo-only'

type Token = {
  name: string
  hex: string
  /** Tailwind utility that paints the swatch. */
  swatch: string
  role: string
  /** Where it is actually used, from a grep of src/. */
  usage: string
  flag?: Flag
  flagNote?: string
}

const FLAG_LABEL: Record<Flag, string> = {
  unused: 'Unused',
  retired: 'Retired from text',
  'logo-only': 'Logo only',
}

const TOKENS: readonly Token[] = [
  {
    name: 'sky',
    hex: '#4A96D2',
    swatch: 'bg-sky',
    role: 'The hero’s sky. Scene colour, never UI.',
    usage: 'One use: the hero track’s background, behind the campus illustration.',
  },
  {
    name: 'horizon',
    hex: '#A8D0EB',
    swatch: 'bg-horizon',
    role: 'A paler sky, declared for a gradient the finished page never used.',
    usage: 'No uses anywhere in src/. It exists only in the @theme block.',
    flag: 'unused',
    flagNote:
      'Nothing references it. It is in the palette because the palette was designed as a set; keep it or drop it, but do not assume it is load-bearing.',
  },
  {
    name: 'cloud',
    hex: '#F7F5EE',
    swatch: 'bg-cloud',
    role: 'The page ground, and the label colour on a brick button.',
    usage: 'Body background, header bar, every content section, the drift shapes.',
  },
  {
    name: 'frost',
    hex: '#DCE3EA',
    swatch: 'bg-frost',
    role: 'The second ground, and every hairline in the system.',
    usage:
      'Footer band, the get-involved card, the divider bands, and every border on the page.',
  },
  {
    name: 'brick',
    hex: '#A2593A',
    swatch: 'bg-brick',
    role: 'The only interactive accent. A brick surface means “join the Discord”.',
    usage: 'The button fill, and the hover colour for links on cloud. Nothing else.',
  },
  {
    name: 'stone',
    hex: '#C4B79E',
    swatch: 'bg-stone',
    role: 'A warm rule colour, used at 60% for a softer line than frost.',
    usage: 'Two hairlines: the footer’s bottom rule and the get-involved card’s.',
  },
  {
    name: 'pine',
    hex: '#3C5C48',
    swatch: 'bg-pine',
    role: 'All text, all focus rings, and the button’s hover fill.',
    usage:
      'Every piece of copy on the page; pine/90 for secondary text; the one focus-ring colour.',
  },
  {
    name: 'haze',
    hex: '#7C99B4',
    swatch: 'bg-haze',
    role: 'A scene colour. It cannot carry text at any size.',
    usage: 'No uses in src/. Every eyebrow and caption that had it now has pine/90.',
    flag: 'retired',
    flagNote:
      '2.72:1 on cloud and 2.29:1 on frost — under AA for normal text (4.5:1) and under AA large (3:1) as well. pine/90 measures 5.36:1 on cloud and 4.65:1 on frost and replaced it everywhere.',
  },
  {
    name: 'fern',
    hex: '#339966',
    swatch: 'bg-fern',
    role: 'The HackBU logo green. The brand marks and nothing else.',
    usage: 'One use: the two masked spans inside <Wordmark>.',
    flag: 'logo-only',
    flagNote:
      'The two source marks ship in different greens (#339966 and #42B872); painting both through this one token normalises them. It measures 3.27:1 on cloud and 2.75:1 on frost, so it must never appear on a link, a button, a border or any text — logotypes are exempt from WCAG 1.4.3 and 1.4.11, and nothing else here is.',
  },
]

function Swatch({ token }: { token: Token }) {
  return (
    <li className="border-frost flex gap-4 border-b py-4">
      {/*
       * `token.swatch` is a background utility, and for `fern` that is
       * literally the one thing the logo-only rule forbids (P3-7). Kept, and
       * this is the exemption: the rule exists because fern measures 3.27:1 on
       * cloud and so must never carry text, a border or an interactive
       * surface — none of which a 56px `aria-hidden` square in an internal,
       * noindex catalogue is. Showing the token is this element's whole job,
       * and the row's own `flagNote` below states the restriction it is the
       * sole exception to. If the rule is ever machine-checked, exempt this
       * file by name rather than working around it here.
       */}
      <span
        aria-hidden="true"
        className={`${token.swatch} border-frost h-14 w-14 shrink-0 rounded-xl border sm:h-16 sm:w-16`}
      />
      <div className="min-w-0">
        <p className="text-body text-pine font-medium">
          {token.name}
          <span className="text-pine/90 font-normal"> · {token.hex}</span>
          {token.flag ? (
            <span className="border-stone/60 text-caption text-pine/90 ml-2 rounded-full border px-2 py-0.5 align-middle font-normal">
              {FLAG_LABEL[token.flag]}
            </span>
          ) : null}
        </p>
        <p className="text-caption text-pine mt-1">{token.role}</p>
        <p className="text-caption text-pine/90 mt-1">{token.usage}</p>
        {token.flagNote ? (
          <p className="text-caption text-pine border-stone/60 mt-2 border-l-2 pl-3">
            {token.flagNote}
          </p>
        ) : null}
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/* Type                                                                       */
/* -------------------------------------------------------------------------- */

type Step = {
  /** The Tailwind step, exactly as it is written in markup. */
  className: string
  /** The CSS value in the @theme block. */
  declared: string
  family: 'display' | 'sans'
  role: string
  sample: string
}

const STEPS: readonly Step[] = [
  {
    className: 'text-display-xl',
    declared: 'clamp(2.75rem, 7vw, 5rem)',
    family: 'display',
    role: 'The hero headline. One per page.',
    sample: 'Learn to build apps',
  },
  {
    className: 'text-display-lg',
    declared: 'clamp(2rem, 4.2vw, 3rem)',
    family: 'display',
    role: 'Section headline — what <SectionHeader> renders.',
    sample: 'A community of people',
  },
  {
    className: 'text-display-md',
    declared: 'clamp(1.25rem, 2.2vw, 1.5rem)',
    family: 'display',
    role: 'Card and question headlines, and the two big contact links.',
    sample: 'Development workshops',
  },
  {
    className: 'text-lede',
    declared: 'clamp(1.125rem, 1.6vw, 1.375rem)',
    family: 'sans',
    role: 'The opening paragraph under a headline.',
    sample: 'No application, no dues, and no attendance to keep up.',
  },
  {
    className: 'text-body',
    declared: '1.0625rem',
    family: 'sans',
    role: 'Default paragraph, and the md button label.',
    sample: 'Each week we walk through building something for the web.',
  },
  {
    className: 'text-caption',
    declared: '0.875rem',
    family: 'sans',
    role: 'Secondary and meta text, footer links, the sm button label.',
    sample: 'Web development one week, mobile the next.',
  },
  {
    className: 'text-eyebrow',
    declared: '0.75rem',
    family: 'sans',
    role: 'The uppercase label above a headline. 0.2em tracking.',
    sample: 'What HackBU is',
  },
]

/**
 * Reads a step's computed size back off the DOM, because four of the seven are
 * `clamp()` and their px value is a function of the viewport. Re-measures on
 * resize so the number on screen is never stale.
 */
function useComputedType(ref: RefObject<HTMLElement | null>) {
  const [text, setText] = useState('')

  useEffect(() => {
    function measure() {
      const element = ref.current
      if (!element) return
      const style = getComputedStyle(element)
      const size = Number.parseFloat(style.fontSize)
      const lineHeight = Number.parseFloat(style.lineHeight)
      setText(
        `${size.toFixed(1)}px · line-height ${
          Number.isNaN(lineHeight) ? style.lineHeight : `${lineHeight.toFixed(1)}px`
        }`,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [ref])

  return text
}

function TypeSpecimen({ step }: { step: Step }) {
  const sampleRef = useRef<HTMLParagraphElement>(null)
  const computed = useComputedType(sampleRef)

  return (
    <li className="border-frost border-b py-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-caption text-pine font-medium">{step.className}</span>
        <span className="text-caption text-pine/90">
          font-{step.family} · {step.declared}
        </span>
        <span className="text-caption text-pine/90">{computed || 'measuring…'}</span>
      </div>
      <p className="text-caption text-pine/90 mt-1">{step.role}</p>
      <p
        ref={sampleRef}
        className={`${step.className} ${
          step.family === 'display'
            ? 'font-display font-semibold'
            : 'font-sans'
        } ${step.className === 'text-eyebrow' ? 'font-medium uppercase' : ''} text-pine mt-4`}
      >
        {step.sample}
      </p>
    </li>
  )
}

/* -------------------------------------------------------------------------- */

export function TokensPart() {
  return (
    <SheetSection
      id="tokens"
      number="1"
      title="Design tokens"
      intro={
        <>
          Nine colours and seven type steps, all declared in the{' '}
          <span className="font-medium">@theme</span> block of{' '}
          <span className="font-medium">src/index.css</span>. Tailwind turns each{' '}
          <span className="font-medium">--color-*</span> into the matching{' '}
          <span className="font-medium">bg-</span>/
          <span className="font-medium">text-</span>/
          <span className="font-medium">border-</span> utilities and each{' '}
          <span className="font-medium">--text-*</span> into a step, so the names
          below are what you actually type in markup.
        </>
      }
    >
      <Entry
        name="Colour"
        path="src/index.css — @theme { --color-* }"
        use="Nine tokens. Three of them carry a restriction that is not visible from the swatch, flagged below."
      >
        <Block title="Swatches">
          <ul className="border-frost border-t">
            {TOKENS.map((token) => (
              <Swatch key={token.name} token={token} />
            ))}
          </ul>
        </Block>

        <Block title="The rule that keeps this palette honest">
          <Rule>
            brick is the page’s only interactive colour, and pine is its only
            text colour. Every accessibility decision downstream — the two link
            treatments, the single focus-ring tone, the retirement of haze —
            follows from holding those two lines rather than from tuning
            individual pairs.
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="Type scale"
        path="src/index.css — @theme { --text-* }"
        use="Named steps so no call site ever hand-picks a size. Display steps are fluid; body steps are fixed."
      >
        <Block title="Steps, at size">
          <ul className="border-frost border-t">
            {STEPS.map((step) => (
              <TypeSpecimen key={step.className} step={step} />
            ))}
          </ul>
          <Caption>
            The px values are measured off these specimens at the current
            viewport width, not copied from the stylesheet — four of the seven
            steps are clamp() expressions and change as you resize this page.
          </Caption>
        </Block>

        <Block title="Families">
          <div className="grid gap-4 sm:grid-cols-2">
            <Ground tone="cloud" label="font-display">
              <p className="font-display text-display-md text-pine font-semibold">
                Fraunces
              </p>
              <p className="text-caption text-pine/90 mt-3">
                'Fraunces', ui-serif, Georgia, 'Times New Roman', serif
              </p>
              <p className="text-caption text-pine/90 mt-2">
                Self-hosted via @fontsource. Weight 600 only — a heading asking
                for any other weight gets a synthesised face.
              </p>
            </Ground>
            <Ground tone="cloud" label="font-sans">
              <p className="font-sans text-display-md text-pine font-medium">
                Inter
              </p>
              <p className="text-caption text-pine/90 mt-3">
                'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
                Roboto, Helvetica, Arial, sans-serif
              </p>
              <p className="text-caption text-pine/90 mt-2">
                Self-hosted via @fontsource. Weights 400 and 500 only — 400 for
                copy, 500 for eyebrows and button labels.
              </p>
            </Ground>
          </div>
        </Block>
      </Entry>
    </SheetSection>
  )
}
