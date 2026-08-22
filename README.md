# HackBU landing page

A redesigned landing page for [HackBU](https://hackbu.org), the student tech club at
Binghamton University. One job: get undergrads — most of them with no programming
experience — into the Discord.

The hero is a painterly illustration of campus under snow. On load only sky and clouds
fill the screen; scrolling tilts the view down through drifting cloud layers to reveal
the whole campus, holds for a beat, then scrolls away to the content below.

This replaces **only** the landing page. The blog, registration, photos, schedule,
resources, organizers, hackathons and sponsors pages stay where they are and are linked
from the header and footer.

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (theme lives in `src/index.css`,
  not a JS config)
- **`motion`** (Framer Motion) for every animation — all scroll work goes through
  `useScroll` / `useTransform` / `whileInView`. There are no `scroll` event listeners.
- **Vercel** for hosting
- `sharp` as a dev-only dependency for generating image derivatives

## Local setup

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-checks (`tsc -b`) then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run typecheck` | `tsc -b --noEmit` — types only, no output |
| `npm run lint` | `oxlint` |
| `npm run images` | Regenerates AVIF/WebP derivatives from `public/artwork/` |

> `npm run typecheck` uses `tsc -b`, not a bare `tsc --noEmit`. The root `tsconfig.json`
> is a solution file (`"files": []` plus project references), so a bare `tsc --noEmit`
> would silently check nothing.

## Deploying

Vercel picks up `vercel.json`, which pins the framework to Vite, the build command to
`npm run build` and the output directory to `dist`. No environment variables, no backend,
no database.

```bash
npx vercel deploy --prod
```

Image derivatives are **committed**, so `npm run images` does not run during a deploy —
a build is just `vite build`. Run it by hand whenever the artwork changes (see below).

## Swapping the artwork

Source art lives in `artwork/`, which is treated as read-only reference. The files the
site actually ships are in `public/artwork/`.

```
artwork/                     read-only originals
public/artwork/
  campus/Campus.png          the campus illustration
  campus/Campus-{640,960,1280,1672}.{avif,webp}
  clouds/cloud-1..6.png      transparent cloud cutouts
  clouds/cloud-1..6.{avif,webp}
```

To replace the artwork:

1. Drop the new PNGs into `public/artwork/`, keeping the same filenames. The campus
   illustration must stay a single opaque image; the clouds must stay RGBA cutouts with
   real alpha.
2. Run `npm run images` to regenerate the AVIF and WebP derivatives. The PNGs remain as
   the `<picture>` fallback.
3. Update `ASSETS.md`, which records every file with its pixel dimensions.
4. Commit the regenerated derivatives along with the new PNGs.

### If the new campus illustration is framed differently

Two numbers in the hero are tied to the specific artwork and will need re-deriving:

- **`PAN_START_SCALE`** in `src/components/Hero.tsx` (currently `3`). The hero shows the
  top `1/scale` of the image at scroll 0, and nothing but sky may be visible there. In the
  current illustration the first buildings appear at `0.351` of the image height, so the
  start scale must stay above `1 / 0.351 ≈ 2.86`. Measure where buildings begin in the new
  image and set the scale accordingly. Note this is a floor, not a preference — dropping
  below it puts rooftops on screen before the user has scrolled.
- **`object-position`** on the campus `<img>` (currently `52% 0%`). The horizontal value
  keeps the focal point — the Library Tower — centred when narrow viewports crop the
  sides. The vertical `0%` pins the image's top edge and, together with
  `transform-origin: top`, is what keeps the framing correct on ultra-wide displays; leave
  it at `0%`.

Cloud placement and the three depth layers are configured at the top of
`src/components/HeroClouds.tsx`. The horizontal drift loop derives its tile count from how
far clouds hang past the tile edge, so clouds can be repositioned freely without breaking
the seamless wrap.

## Conventions worth knowing before editing

**Colour.** Eight tokens, defined once in the `@theme` block of `src/index.css`, and
nothing else — no arbitrary hex, no default Tailwind palette colours, no `#000000`.

| Token | Hex | Role |
| --- | --- | --- |
| `sky` | `#4A96D2` | hero sky |
| `horizon` | `#A8D0EB` | sky gradient bottom, secondary fills |
| `cloud` | `#F7F5EE` | page background below the fold |
| `frost` | `#DCE3EA` | dividers, muted surfaces, card fills |
| `brick` | `#A2593A` | the single accent — links, buttons, hover |
| `stone` | `#C4B79E` | tertiary / decorative only |
| `pine` | `#3C5C48` | body text and headings (never pure black) |
| `haze` | `#7C99B4` | scene colour only |

`brick` is the **only** accent; adding a second one is a design regression. `haze` is
retired from text use — it measures 2.72:1 on `cloud`, well below WCAG AA. Secondary text
uses `pine/90`.

**Animation.** Only `transform` and `opacity` are ever animated — never `top`, `left`,
`width`, `height`, `margin` or `background-position`. Every animation is gated behind
`usePrefersReducedMotion()` from `src/lib/motion.ts`; under
`prefers-reduced-motion: reduce` the hero pan, the cloud drift and the section reveals all
render at rest, and the hero's tall scroll track collapses so no dead scroll space is left
behind.

**Text over the illustration.** The hero contains no text and no focusable elements, by
design. The illustration is the signature moment and is never used as a background behind
copy — the headline and primary CTA sit in the intro section immediately below it.

## Layout

```
src/
  App.tsx                    page composition
  index.css                  Tailwind theme: colour tokens, type scale, fonts
  lib/
    links.ts                 every off-site URL, centralised
    motion.ts                usePrefersReducedMotion, hero scroll context
    images.ts                <picture> source sets
  components/
    Hero.tsx                 sticky stage + scroll-driven campus pan
    HeroClouds.tsx           three parallax cloud layers
    Reveal.tsx               whileInView reveals (enter-once, staggered)
    Layout.tsx               Container / Section / SectionHeader
    SiteHeader.tsx           fixed header, collapses to a menu at 390px
    SiteFooter.tsx           all eight existing site pages, contact, socials
    SnowdriftDivider.tsx     inline SVG snowdrift dividers
    ButtonLink.tsx, ExternalLink.tsx, Wordmark.tsx
    sections/                Intro, About, GetInvolved, Questions, Contact
scripts/
  generate-images.mjs        AVIF/WebP derivative generator
```
