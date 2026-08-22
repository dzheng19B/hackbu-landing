# HackBU landing page

A redesigned landing page for [HackBU](https://hackbu.org), the student tech club at
Binghamton University. One job: get undergrads — most of them with no programming
experience — into the Discord.

The hero is a painterly illustration of campus under snow. On load the screen holds the
top third of it — sky, drifting clouds, and the wooded ridgeline on the far side of
campus, but **no buildings**; scrolling tilts the view down through the cloud layers to
reveal the whole campus, holds for a beat, then scrolls away to the content below.

(At `PAN_START_SCALE = 3` the opening frame is image rows 0–0.333, and the hill and
treeline silhouette breaks the horizon at row 0.1934 — so about 42% of that frame is
distant hills. The first rooftops are at 0.351 and stay off screen. Showing literally
nothing but sky would need a start scale above `1 / 0.1934 ≈ 5.17`, which would upscale
the 1672px source past 5x into mush, so the guarantee the hero actually keeps is
*no buildings*, not *only sky*.)

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

**Node 24 or newer** — declared as `"engines": { "node": ">=24" }` in `package.json`, which
is both what `npm install` warns against and what Vercel reads to pick a build runtime. The
toolchain (Vite 8, TypeScript 6, `@types/node` 24, `sharp`) is what sets the floor.

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
| `npm run build` | Lints, type-checks (`tsc -b`), builds to `dist/`, then prerenders both pages into it |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run typecheck` | `tsc -b --noEmit` — types only, no output |
| `npm run lint` | `oxlint --deny-warnings` — any diagnostic is a failure |
| `npm run images` | Regenerates the AVIF/WebP artwork derivatives and the `public/brand/` logo masks and app icons |

> `npm run typecheck` uses `tsc -b`, not a bare `tsc --noEmit`. The root `tsconfig.json`
> is a solution file (`"files": []` plus project references), so a bare `tsc --noEmit`
> would silently check nothing.

### Tooling

**Lint is a gate, not a report.** Every oxlint rule but one is a warning, so `npm run lint`
runs with `--deny-warnings` and `npm run build` runs it first — a warning fails the build,
and therefore the deploy, because `vercel.json` builds with `npm run build`. There is no CI
workflow in the repo; the build script is the only enforcement point there is.

**Enabled plugins** (`.oxlintrc.json`): `react`, `typescript`, `oxc`, `unicorn`, `jsx-a11y`.
Naming `plugins` at all *replaces* oxlint's default set rather than adding to it, so
`unicorn` has to be listed explicitly to keep the 13 rules that are on by default; `jsx-a11y`
is listed because accessibility is this page's main risk surface and 35 of its rules catch by
hand what a review would otherwise have to re-derive every time.

**The one suppression.** `src/components/Wordmark.tsx` turns off `jsx-a11y/prefer-tag-over-role`
for a single attribute, with the reasoning in that file's doc comment: the logo lockup is two
mask-painted `<span>`s that have to be announced as one graphic, which is what WAI-ARIA's
`img` role is for, and there is no image file for the `<img>` element the rule asks for. It is
an inline disable, not a config-level one, so the rule stays on everywhere else. oxlint's JSON
config takes no comments, which is why any such decision is recorded here.

**TypeScript strictness** (`tsconfig.app.json`, `tsconfig.node.json`): `strict` and
`noUncheckedIndexedAccess` are both declared `true`. `strict` is written out rather than left
to the compiler default so the setting survives a compiler upgrade. `exactOptionalPropertyTypes`
is deliberately off — motion's `MotionProps` types `viewport` as optional without `| undefined`,
which makes passing one through an error at every spread site; see the note in
`tsconfig.app.json`.

**Tailwind scanning** is scoped to `src/` by `@import 'tailwindcss' source('.')` in
`src/index.css`. Left unscoped, Tailwind's automatic detection reads every file the repo does
not gitignore — including Markdown — and any utility name that appears as prose in one of them
becomes a rule in the shipped stylesheet. Neither HTML entry carries a `class` attribute; if
one ever does, it needs an explicit `@source` line.

## Deploying

Vercel picks up `vercel.json`, which pins the framework to Vite, the build command to
`npm run build` and the output directory to `dist`. No backend, no database, and nothing
to configure in the project settings.

```bash
npx vercel deploy --prod
```

Image derivatives are **committed**, so `npm run images` does not run during a deploy —
a build is lint, `tsc -b`, `vite build` and `node scripts/prerender.mjs`, nothing else. Run
it by hand whenever the artwork changes (see below).

`vercel.json` also declares a `headers` block. `/assets/(.*)` — everything Vite emits, all
of it content-hashed — is served `public, max-age=31536000, immutable`, because a hashed
filename cannot change meaning and never needs revalidating; `/artwork/(.*)` and
`/brand/(.*)` get `public, max-age=86400, must-revalidate` instead, because those filenames
are stable across `npm run images` and a day-old copy has to be able to notice.

### When the custom domain lands

**Nothing in this repo needs editing.** The one place the site's own origin appears is
`index.html`'s `og:url` and `og:image`, which have to be absolute, and both are written as
`%SITE_ORIGIN%`. The `siteOrigin` plugin in `vite.config.ts` substitutes it at build time
from **`VERCEL_PROJECT_PRODUCTION_URL`** — a variable Vercel sets on every build to the
project's production hostname, which follows the custom domain automatically once one is
attached. Off Vercel the variable is absent and the build falls back to the literal
`https://hackbu-landing.vercel.app`, so a local `dist/index.html` still carries a usable
absolute URL.

If the domain ever moves somewhere without that variable, change the fallback constant in
`vite.config.ts` — not the HTML.

### The component sheet, at `/components`

The build has **two** entry points, declared in `vite.config.ts`: `index.html` (the
landing page) and `components.html` (an internal component sheet — every token, every
primitive with its variants, and the composed sections rendered live). They share the
component tree, so Rollup hoists what both import into one shared chunk and each page's
own entry chunk carries only its own code; nothing under `src/sheet/` reaches the landing
page's bundle. The sheet's Tailwind utilities are kept out of the landing page's
stylesheet by `src/landing.css`, which is `src/index.css` plus one `@source not` line.

Routing it needs the two rewrites in `vercel.json`, and those are the **only** two rules
there — there is no catch-all. Every row below is what that file now does:

| Request | Served by |
| --- | --- |
| `/` | the filesystem — `dist/index.html` as the directory index. No rewrite involved. |
| `/components`, `/components/` | the two rewrites in `vercel.json`, each an exact-match `source`, both pointing at `/components.html` |
| `/components.html` | the filesystem — Vercel gives a real file precedence over `rewrites`. The sheet therefore has a second URL; harmless, because it is `noindex, nofollow`. |
| any other real file (`/assets/…`, `/artwork/…`, `/brand/…`) | the filesystem |
| **anything else** — `/nonexistent`, `/componentsfoo`, `/favicon.ico` | nothing. No file, no matching rewrite → **404**, with `public/404.html` (shipped as `dist/404.html`) as the body. |

The last row is a deliberate choice: an unknown URL gets an honest 404 rather than a
200 landing page. There is no client-side router here — one page, in-page anchors — so a
catch-all rewrite to `/index.html` would only turn every typo and every stale inbound link
into a soft 404 and an indexable duplicate of the home page.

**The Vite dev server does not emulate this**: it applies its own unconditional
`index.html` fallback, so `/nonexistent` and `/componentsfoo` both render the landing page
with a 200 locally, and `dist/404.html` is never reached — 404 behaviour can only be
checked against a real deployment.

The sheet is `noindex, nofollow` and is not linked from the landing page.

## Swapping the artwork

Source art lives in `artwork/`, which is treated as read-only reference. The files the
site actually ships are in `public/artwork/`.

```
artwork/                     read-only originals
public/artwork/
  campus/Campus.png          the campus illustration
  campus/Campus-{640,960,1280,1672}.{avif,webp}
  clouds/cloud-1..12.png     transparent cloud cutouts
  clouds/cloud-1..12.{avif,webp}
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
  top `1/scale` of the image at scroll 0, and **no buildings** may be visible there. In
  the current illustration the first buildings appear at `0.351` of the image height, so
  the start scale must stay above `1 / 0.351 ≈ 2.85`. Measure where buildings begin in the new
  image and set the scale accordingly. Note this is a floor, not a preference — dropping
  below it puts rooftops on screen before the user has scrolled.
- **`object-position`** on the campus `<img>` (currently `52% 0%`). The horizontal value
  keeps the focal point — the Library Tower — centred when narrow viewports crop the
  sides. The vertical `0%` pins the image's top edge and, together with
  `transform-origin: top`, is what keeps the framing correct on ultra-wide displays; leave
  it at `0%`.

Cloud placement and the three depth layers are configured at the top of
`src/components/HeroClouds.tsx` — twelve cutouts, four per layer, cast onto the layers by
intrinsic height. The horizontal drift loop derives its tile count from how far clouds
hang past the tile edge, so clouds can be repositioned freely without breaking the
seamless wrap.

`artwork/clouds/clouds-all-b.png` is a reference contact sheet of the twelve cutouts, not
a cutout. It stays in `artwork/` and must not be copied into `public/`, or `npm run
images` will encode it and the browser will download it.

## Swapping the branding

The three brand files live in `brand-source/`, which is read-only reference exactly like
`artwork/`. `npm run images` derives everything the site ships from them into
`public/brand/`.

```
brand-source/                read-only originals
  icon.png                   bearcat line-art mark, transparent
  text.png                   the HACKBU wordmark, transparent
  icon_discord.png           the bearcat on its app tile, opaque
public/brand/
  bearcat-mask-{64,128}.png  alpha-only mask derivatives, 1x and 2x
  wordmark-mask-{192,384}.png
  favicon-{32,64}.png        from icon.png
  apple-touch-icon.png       180x180, from icon_discord.png
  og-image.png               732x732, from icon_discord.png
```

**The marks are masks, not pictures.** `<Wordmark>` renders two empty elements painted in
the `fern` token; each one's shape is cut from the alpha channel of a mask derivative via
`mask-image` (`.brand-mark-*` in `src/index.css`). That is what lets the bearcat's
`#339966` and the wordmark's `#42B872` come out as one colour without editing either file,
and it keeps the logo's colour in the stylesheet with every other colour in the system.
The derivatives carry no colour at all — their RGB is flattened to white before encoding,
because `mask-image` reads only alpha.

To replace the branding: drop new PNGs into `brand-source/` under the same names, run
`npm run images`, and check the ink dimensions it prints against `BEARCAT_MARK` /
`WORDMARK_MARK` in `src/lib/images.ts` — those are what give each mark its `aspect-ratio`.
`icon_discord.png` is an app tile and stays one: it is the touch icon and the social card,
and its pale green must not enter the stylesheet.

## Conventions worth knowing before editing

**Colour.** Eight palette tokens plus one logo-only token, defined once in the `@theme`
block of `src/index.css`, and nothing else — no arbitrary hex, no default Tailwind
palette colours, no `#000000`.

| Token | Hex | Role |
| --- | --- | --- |
| `sky` | `#4A96D2` | hero sky |
| `horizon` | `#A8D0EB` | **currently unused** — the sky is a single flat field, not a gradient |
| `cloud` | `#F7F5EE` | page background below the fold |
| `frost` | `#DCE3EA` | dividers, muted surfaces, card fills |
| `brick` | `#A2593A` | the single accent — links, buttons, hover |
| `stone` | `#C4B79E` | tertiary / decorative only |
| `pine` | `#3C5C48` | body text, headings, focus rings, the button hover fill and the toggle's border/hover fill (never pure black) |
| `haze` | `#7C99B4` | **currently unused** — retired from text (2.72:1 on `cloud`, below AA) and not used as a scene colour either |
| `fern` | `#339966` | **logo only** — the two brand marks, and nothing else |

`brick` is the **only** accent; adding a second one is a design regression. `haze` is
retired from text use — it measures 2.72:1 on `cloud`, well below WCAG AA. Secondary text
uses `pine/90`.

`fern` is the brand green and is **not** an accent. It exists so the two logo marks —
which ship in two different greens, neither of them a palette colour — can be normalised
to one. It fills the marks and nothing else: no link, button, border, background or text.
It measures 3.27:1 on `cloud`, which a logotype is exempt from and a word is not.

Link hover is a per-surface rule, and it lives in one place. `LINK_ON_CLOUD` and
`LINK_ON_FROST` in `src/components/ExternalLink.tsx` are the only two **text-link**
treatments on the page: brick hover on `cloud` (4.78:1), underline hover on `frost`, because brick on
frost measures 4.03:1 and fails AA. Pick by the surface the link is painted on.

There is a third named treatment, and it is not for links: `TOGGLE_ON_CLOUD` in
`src/components/controls.ts` — the small outlined pill `<button>` (the header's menu
toggle, and two controls on the component sheet). Border `pine` on `cloud` at **6.83:1**,
clearing the 3:1 of WCAG 1.4.11, and a `pine` hover fill with the label flipping to
`cloud`. It replaces a `frost` border and `frost` hover fill that measured 1.19:1 — a
boundary and a hover state that could not be seen. `pine` rather than `brick`, because
`brick` still means "join the Discord" and nothing else. Three treatments, then: two for
links, one for the outlined button, and no fourth without a line here.

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
  main.tsx                   landing entry: hydrateRoot in prod, createRoot in dev
  entry-server.tsx           build-time SSR render, read by scripts/prerender.mjs
  App.tsx                    page composition
  index.css                  Tailwind theme: colour tokens, type scale, fonts
  landing.css                index.css plus one `@source not` line, excluding the sheet
  lib/
    links.ts                 every off-site URL, centralised
    motion.ts                usePrefersReducedMotion, hero scroll context
    images.ts                <picture> source sets + brand mark geometry
  components/
    Hero.tsx                 sticky stage + scroll-driven campus pan
    HeroClouds.tsx           three parallax cloud layers
    Reveal.tsx               whileInView reveals (enter-once, staggered)
    Layout.tsx               Container / Section / Eyebrow / SectionHeader
    SiteHeader.tsx           fixed header, collapses to a menu below `md` (768px)
    SiteFooter.tsx           all eight existing site pages, contact, socials
    SnowdriftDivider.tsx     inline SVG snowdrift dividers
    ButtonLink.tsx           the page's one button treatment
    ExternalLink.tsx         same-site vs new-tab routing + the two text-link treatments
    controls.ts              TOGGLE_ON_CLOUD — the outlined pill button
    Wordmark.tsx             the logo lockup, as masked fern marks
    sections/                Intro, About, GetInvolved, Questions, Contact
  sheet/                     the component sheet at /components — see above
    main.tsx                 sheet entry: hydrateRoot in prod, createRoot in dev
    sheet.css, kit.tsx, ComponentSheet.tsx
    parts/                   Tokens, Primitives, Composed, Hero
scripts/
  generate-images.mjs        artwork derivatives + brand masks and app icons
  prerender.mjs              build-time prerender, run after `vite build`
public/
  artwork/                   campus + cloud PNGs and their derivatives
  brand/                     logo masks, favicons, app tile
  404.html                   the static 404 body (see "The component sheet" above)
```
