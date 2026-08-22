# Phase 4 — Accessibility audit (WCAG 2.2 Level AA)

Static review of the **landing page only** — `src/**` except `src/sheet/`, plus
`index.html`. Nothing was executed in a browser; every claim below is derived from source
text, from Tailwind's compiled output in `dist/assets/index-CePBE3nM.css` (read-only, used
only to confirm what the utility class names actually emit), or from arithmetic shown in
§7. Items that genuinely need a live browser are collected in §10 for Phase 7.

Scope note carried from Phase 1: **P1-5** — the Tailwind scanner reads `audit/*.md` as
loose text, so class names written here are emitted into the stylesheet as real rules.
Class names appear below only where they are the evidence; token names (`pine`, `cloud`)
are used in prose wherever that costs nothing.

Cross-references: `audit/01-baseline.md`, `audit/02-code.md`, `audit/03-design-system.md`.
Phase 3 §5 supplied the starting foreground/background pair list; §7 extends it.

---

## 1. Document-level (`index.html`)

| Check | Result | Evidence | SC |
| --- | --- | --- | --- |
| `lang` on the root element | **PASS** — `lang="en"` | `index.html:2` | 3.1.1 Language of Page (A) |
| Viewport does not block zoom | **PASS** — `content="width=device-width, initial-scale=1.0"`; no `user-scalable=no`, no `maximum-scale` | `index.html:21` | 1.4.4 Resize Text (AA) / 1.4.10 Reflow (AA) |
| Page has a title | **PASS** — `<title>HackBU</title>` | `index.html:74` | 2.4.2 Page Titled (A) |
| Decorative-only meta imagery is out of the page | **PASS** — favicons and `og:image` are head-only; `og:image:alt` is present | `index.html:11,12,19,71` | 1.1.1 (A) — informative |

The `<link rel="preload">` at `index.html:39–51` carries no accessible surface (it fetches
the campus derivative that `<picture>` resolves to). No accessibility consequence.

---

## 2. Landmarks and heading order

### 2.1 Landmarks

| Landmark | Element | `file:line` | Accessible name |
| --- | --- | --- | --- |
| `banner` | `<header>` — direct child of a plain `<div>`, so it is page-scoped | `src/components/SiteHeader.tsx:47` | none (not required) |
| `navigation` | `<nav aria-label="Primary">` — desktop bar, `md` and up | `src/components/SiteHeader.tsx:56` | "Primary" |
| `navigation` | `<nav aria-label="Primary — compact">` — inside the disclosure panel | `src/components/SiteHeader.tsx:93` | "Primary — compact" |
| `main` | `<main id="main">` | `src/App.tsx:37` | none (not required) |
| `region` | `<section id="top" aria-label="Campus illustration">` — the hero | `src/components/Hero.tsx:165,172` | "Campus illustration" |
| `region` ×5 | `<section aria-labelledby={labelledBy}>` via `Section` | `src/components/Layout.tsx:41–45`, instantiated at `IntroSection.tsx:34`, `AboutSection.tsx:29`, `GetInvolvedSection.tsx:19–23`, `QuestionsSection.tsx:32`, `ContactSection.tsx:17` | the section's own heading |
| `contentinfo` | `<footer>` | `src/components/SiteFooter.tsx:21` | none (not required) |

**Checked and clean:**

- Exactly one `banner` and one `contentinfo`. The second `<header>` in the codebase
  (`src/components/Layout.tsx:95`) is nested inside a `<section>` — a sectioning-content
  ancestor — so per *ARIA in HTML* it does **not** map to `banner`. No duplicate landmark.
- The two `<nav>` elements carry **distinct** `aria-label` values, so they are
  distinguishable in a landmark list (`SiteHeader.tsx:56,93`).
- The compact `<nav>` lives inside `<div id="primary-menu" hidden={!menuOpen}>`
  (`SiteHeader.tsx:87–91`), so while closed it is removed from the accessibility tree and
  the tab order. Confirmed against Tailwind's Preflight, which emits
  `[hidden]:where(:not([hidden=until-found])){display:none!important}`, and the panel
  carries no competing display utility below the `md` breakpoint.
- All page content sits inside `banner` / `main` / `contentinfo`, except the
  `cloud-to-frost` divider at `src/App.tsx:71`, which is `aria-hidden="true"`
  (`SnowdriftDivider.tsx:84`) and therefore contributes nothing orphaned to the tree.

Relevant SC: **1.3.1 Info and Relationships (A)**, **2.4.1 Bypass Blocks (A)**.

### 2.2 Heading order

| Level | Text / source | `file:line` |
| --- | --- | --- |
| `h1` | "Learn to build apps with other students." — the page's only `h1` | `src/components/sections/IntroSection.tsx:38–43` |
| `h2` | "A community of people who solve problems with technology." | `src/components/Layout.tsx:97–102` via `AboutSection.tsx:31–36` |
| `h3` ×2 | "Development workshops" / "An annual hackathon" | `src/components/sections/AboutSection.tsx:47–49` |
| `h2` | "No membership or commitment required." | `src/components/Layout.tsx:97` via `GetInvolvedSection.tsx:25–30` |
| `h2` | "Questions newcomers actually have." | `src/components/Layout.tsx:97` via `QuestionsSection.tsx:34–38` |
| `h2` | "Still have a question?" | `src/components/Layout.tsx:97` via `ContactSection.tsx:19–24` |
| `h2` ×3 | "Club" / "More" / "Follow" — footer column headings | `src/components/Layout.tsx:74` with `as="h2"` at `src/components/SiteFooter.tsx:60`, called from `SiteFooter.tsx:32,33,34` |

**Result: PASS.** Exactly one `h1`; it is the first heading in the document (the hero and
the header carry none); the sequence is h1 → h2 → h3 → h2 → h2 → h2 → h2 h2 h2 with no
skipped level. The `Eyebrow` component defaults to `<p>` (`Layout.tsx:70,74`) precisely so
that section kickers do not inject phantom headings — verified: `as="h2"` is passed at
exactly one call site, `SiteFooter.tsx:60`.

The questions list uses `<dl>` / `<dt>` / `<dd>` rather than headings
(`QuestionsSection.tsx:41,47,50`). The intervening `<div>` produced by `RevealItem`
(`Reveal.tsx:158`) is valid between `<dl>` and its `<dt>`/`<dd>` pairs per the HTML
specification, so the definition-list relationship survives the reveal wrapper — **1.3.1
PASS**.

---

## 3. Images, `<picture>` elements, SVG and the CSS-mask brand marks

Every non-text graphic in the landing page, exhaustively (sweep:
`grep -rn "<img\|<picture\|<svg\|brand-mark" src/ --include=*.tsx | grep -v "^src/sheet"`).

| # | Graphic | `file:line` | Accessible name / status | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Campus illustration `<picture>` + `<motion.img>` | `src/components/Hero.tsx:190–214`; `alt` at `:203` | `alt={CAMPUS_ALT}` — a 34-word description of the scene, defined at `src/lib/images.ts:64–67` | **PASS** |
| 2 | Cloud cutout `<picture>` + `<img>` (one component, rendered many times) | `src/components/HeroClouds.tsx:612–623`; `alt=""` at `:617`, `aria-hidden="true"` at `:618` | Empty alt **and** `aria-hidden` — decorative, twice over | **PASS** |
| 3 | Cloud tile wrapper | `src/components/HeroClouds.tsx:637` | `aria-hidden="true"` | **PASS** |
| 4 | Reduced-motion cloud wrapper | `src/components/HeroClouds.tsx:664` | `aria-hidden="true"` | **PASS** |
| 5 | Cloud layer root | `src/components/HeroClouds.tsx:773` | `aria-hidden="true"` on the whole `data-hero-clouds` subtree, plus `pointer-events-none` | **PASS** |
| 6 | Menu glyph `<svg>` (hamburger / close) | `src/components/SiteHeader.tsx:121–130` | `aria-hidden="true"` (`:123`), `focusable="false"` (`:124`); the button's name comes from visually-hidden text at `:79–81` | **PASS** |
| 7 | Snowdrift divider `<svg>` | `src/components/SnowdriftDivider.tsx:87–96` | wrapper `aria-hidden="true"` (`:84`), `focusable="false"` (`:90`) | **PASS** |
| 8 | Bearcat mark — CSS `mask-image` on an empty `<span>` | `src/components/Wordmark.tsx:51–54`; mask at `src/index.css:157–160` | Presentational child of the wrapper | **PASS** (see below) |
| 9 | HACKBU wordmark — CSS `mask-image` on an empty `<span>` | `src/components/Wordmark.tsx:55–58`; mask at `src/index.css:162–165` | Presentational child of the wrapper | **PASS** (see below) |

**The two mask marks (8, 9) do have an accessible name.** Their wrapper carries
`role="img"` and `aria-label="HackBU"` (`src/components/Wordmark.tsx:47–48`), which names
the lockup once and makes both children presentational — the correct treatment for two
marks that are one logo. This also supplies the accessible name for the header link that
wraps them (`SiteHeader.tsx:49–54`), which would otherwise have none: both spans are empty
elements with no text to fall back on. **1.1.1 Non-text Content (A) PASS**;
**2.4.4 Link Purpose (In Context) (A) PASS** for the logo link.

### Correction to the phase brief

The brief states the campus illustration is documented as content "per README". It is not:
`README.md:7–10` describes the hero's behaviour but never classifies the image. The
"content, not decoration" claim lives in a source comment at **`src/lib/images.ts:60–63`**,
immediately above `CAMPUS_ALT`. The classification itself is right — the illustration is
the page's opening statement, not a background — and the alt text delivered at
`Hero.tsx:203` matches it. Only the cited location changes.

---

## 4. Links: new-tab behaviour and `rel` hardening

Every off-site link on the page routes through one component:

```
src/components/ExternalLink.tsx:52
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
```

`rel="noopener noreferrer"` is therefore present on **every** `target="_blank"` link with
no per-call-site opportunity to forget it. Verified consumers:

| Consumer | `file:line` | Count |
| --- | --- | --- |
| Header nav links | `src/components/SiteHeader.tsx:58–64` over `NAV_LINKS` (`src/lib/links.ts:16–20`) | 3 |
| Header CTA (via `ButtonLink`) | `src/components/SiteHeader.tsx:66`, `ButtonLink.tsx:53` | 1 |
| Compact-panel nav links | `src/components/SiteHeader.tsx:95–102` | 3 |
| Compact-panel CTA | `src/components/SiteHeader.tsx:104–111` | 1 |
| Intro CTA | `src/components/sections/IntroSection.tsx:50–52` | 1 |
| Get-involved CTA | `src/components/sections/GetInvolvedSection.tsx:46–52` | 1 |
| Mailing-list link | `src/components/sections/GetInvolvedSection.tsx:58–63` | 1 |
| Contact resources link | `src/components/sections/ContactSection.tsx:41–46` | 1 |
| Footer page + social links | `src/components/SiteFooter.tsx:64` over `SITE_PAGES` (8) and `SOCIAL_LINKS` (5) | 13 |

`MailLink` deliberately does **not** get `target="_blank"`
(`src/components/ExternalLink.tsx:66–69`) — a mail client should not open in a throwaway
tab. Two `mailto:` links: `SiteFooter.tsx:38–41` and `ContactSection.tsx:30–33`.

**No link anywhere announces that it opens a new tab** — there is no visually-hidden
suffix, no `aria-label` override, and no `title` attribute (sweep for `title=` returns only
React props on `SectionHeader` / `FooterColumn`, never an HTML attribute). See **P4-1**.

---

## 5. Focus visibility, per interactive element type

There is **no** global `:focus-visible` rule and **no** `outline: none` anywhere in
`src/index.css` or `src/landing.css` — the browser default ring is never suppressed, and
every focus treatment is an explicit per-element utility. Sweep:
`grep -rn "outline-none\|outline:none\|outline: none\|focus:outline-\|focus-visible" src/ --include=*.tsx --include=*.css | grep -v "^src/sheet"`
returns exactly five hits, all listed below.

| Interactive element | Focus treatment | `file:line` | Trigger |
| --- | --- | --- | --- |
| **Skip link** | pine outline, 2px, rounded pill, promoted out of `sr-only` | `src/App.tsx:28–33` (ring tokens on `:30`) | `:focus` — deliberate, so it appears for mouse-initiated focus too |
| **Header logo link** | pine outline, 2px, offset 4px | `src/components/SiteHeader.tsx:51` | `:focus-visible` |
| **Nav link** (desktop and compact) | pine outline, 2px, offset 4px, via `LINK_ON_CLOUD` | `src/components/ExternalLink.tsx:28–33`, applied at `SiteHeader.tsx:27,61,98` | `:focus-visible` |
| **Header CTA / every Discord button** | pine outline, 2px, offset 2px | `src/components/ButtonLink.tsx:31`, applied at `SiteHeader.tsx:66,104`, `IntroSection.tsx:50`, `GetInvolvedSection.tsx:46` | `:focus-visible` |
| **Mobile menu button** | pine outline, 2px, offset 2px | `src/components/SiteHeader.tsx:77` | `:focus-visible` |
| **Footer link** (8 page links + 5 social links) | pine outline, 2px, offset 4px, via `LINK_ON_FROST` | `src/components/ExternalLink.tsx:28,36–38`, applied at `SiteFooter.tsx:14,64` | `:focus-visible` |
| **Social link** | identical to footer link — same `FOOTER_LINK_CLASSES` constant | `src/components/SiteFooter.tsx:14,34,64` | `:focus-visible` |
| **Mail link (footer)** | pine outline, 2px, offset 4px, via `LINK_ON_FROST` | `src/components/SiteFooter.tsx:38–41` | `:focus-visible` |
| **Mail link (contact section)** | pine outline, 2px, offset 4px, via `LINK_ON_CLOUD` | `src/components/sections/ContactSection.tsx:7–9,30–33` | `:focus-visible` |
| **Mailing-list link** | pine outline, 2px, offset 4px, via `LINK_ON_FROST` | `src/components/sections/GetInvolvedSection.tsx:58–61` | `:focus-visible` |
| **Contact resources link** | pine outline, 2px, offset 4px, via `LINK_ON_CLOUD` | `src/components/sections/ContactSection.tsx:41–44` | `:focus-visible` |

**Every interactive element on the page has an explicit focus indicator.** No element type
is missing one. **2.4.7 Focus Visible (AA) PASS** on a static reading; contrast of the ring
is measured in §7 (6.83:1 on cloud, 5.76:1 on frost — both clear the 3:1 non-text bar).

Two things were verified rather than assumed, because both could have silently produced no
ring at all:

1. **The utilities compile to a real outline.** Tailwind v4 splits width from style, so
   `outline-2` alone would be inert without a style. The built stylesheet emits
   `outline-2:focus{outline-style:var(--tw-outline-style);outline-width:2px}` with
   `--tw-outline-style:solid` as the default — a genuine 2px solid ring. Offsets emit as
   `outline-offset:2px` / `4px`. (`dist/assets/index-CePBE3nM.css`.)
2. **The skip link is not broken by cascade order.** Tailwind's `not-sr-only` sets
   `position:static` and `padding:0`, which would defeat the skip link's absolute
   positioning and padding if it sorted last. Measured byte offsets in the built
   stylesheet: `.focus\:not-sr-only:focus` at 14306, `.focus\:absolute:focus` at 14441,
   `.focus\:px-4:focus` at 14670, `.focus\:py-2:focus` at 14729. Equal specificity, and
   the positioning and padding rules come later, so they win. The focused skip link is a
   positioned pill at `top-4 left-4` with `z-index:60`, above the header's `z-index:50`
   (`SiteHeader.tsx:47`). **Working as intended.**

---

## 6. Reduced motion, per animated component

Convention is defined once at `src/lib/motion.ts:41–43` (`usePrefersReducedMotion()`
normalises motion's `boolean | null` to a definite boolean) with the contract stated at
`src/lib/motion.ts:33–39`: an animated component must render its *resting* frame and must
also give back any scroll distance it bought.

| Component | Animated? | Reduced-motion handling | `file:line` |
| --- | --- | --- | --- |
| **`Hero`** | Yes — scroll-linked scale pan, 3× → 1× | Hook read at `:135`; pan pinned to `1` (the resting frame) at `:150–152`; the 260dvh track collapses to `h-dvh` at `:176`, so no dead scroll space remains; `will-change-transform` also dropped at `:209–211` | `src/components/Hero.tsx:135,150–152,176,209–211` |
| **`HeroClouds`** | Yes — infinite time-linked drift **plus** scroll-linked lift and fade | Hook read via context at `:712`; early return at `:731–743` renders `RestingCloudSet` with a static opacity and **no** drift track, **no** scroll-linked `y`, **no** scroll-linked opacity | `src/components/HeroClouds.tsx:712,731–743,662–676` |
| **`Reveal`** | Yes — opacity + translateY on viewport entry | Hook at `:65`; motion props replaced by `{}` at `:67–68`, so there is no `initial` to paint from and the element renders at rest on the first frame | `src/components/Reveal.tsx:65,67–68` |
| **`RevealGroup`** | Yes — stagger orchestration | Hook at `:96`; motion props `{}` at `:98–99` | `src/components/Reveal.tsx:96,98–99` |
| **`RevealItem`** | Yes — inherits group variants | Hook at `:143`; motion props `{}` at `:145–147` | `src/components/Reveal.tsx:143,145–147` |
| **`SnowdriftDivider`** | **No** | N/A — the component imports nothing from `motion` and renders a static SVG | `src/components/SnowdriftDivider.tsx:1–99` (no `motion` import; wrapper is `aria-hidden` at `:84`) |
| **`SiteHeader`** | **No** | N/A — no `motion` import | `src/components/SiteHeader.tsx:1–6` |
| **`SiteFooter`** | **No** | N/A — no `motion` import | `src/components/SiteFooter.tsx:1–4` |
| `App`, `Layout`, `Wordmark` | **No** | N/A — no `motion` import | verified by sweep |

Sweep used:
`grep -rn "motion" src/components/SiteHeader.tsx src/components/SiteFooter.tsx src/components/Layout.tsx src/components/Wordmark.tsx src/components/SnowdriftDivider.tsx src/App.tsx`
→ no matches.

**Relevant criteria.** **2.3.3 Animation from Interactions** is Level **AAA**, so the
scroll-linked pan and parallax are not an AA obligation; the page honours it anyway.
**2.2.2 Pause, Stop, Hide (Level A)** is the one that bites, because the cloud drift is
time-linked and infinite rather than scroll-linked — see **P4-4**.

**`Reveal` does not hide content from assistive technology.** The hidden state is
`{ opacity: 0, y: DISTANCE }` (`Reveal.tsx:52`, `:70`) — opacity and transform only, never
`visibility: hidden` or `display: none`. The element stays in the accessibility tree, stays
in the tab order, and stays findable by browser find-in-page throughout. Confirmed by
reading both variant objects and both inline prop objects; there is no `visibility` or
`display` key anywhere in the file. **1.3.2 Meaningful Sequence (A)** and
**4.1.2 Name, Role, Value (A)** are unaffected.

---

## 7. Contrast

### 7.1 Method

WCAG 2.x relative luminance and contrast ratio, straight from the specification:

```
per 8-bit channel c:   cs = c/255
                       lin = cs <= 0.03928 ? cs/12.92 : ((cs+0.055)/1.055)**2.4
relative luminance:    L = 0.2126*Rlin + 0.7152*Glin + 0.0722*Blin
contrast ratio:        (Llighter + 0.05) / (Ldarker + 0.05)
```

Alpha foregrounds are **composited over their actual background first**, in sRGB, the way
the browser compositor does it (`out = a*fg + (1-a)*bg` per 8-bit channel, then rounded to
8 bits). This matters for `text-pine/90` and `border-stone/60`, whose measured value
differs by background. Both compile to plain 8-bit-alpha hex with a `color-mix` upgrade —
confirmed in the built stylesheet:

```
text-pine\/90{color:#3c5c48e6}
text-pine\/90{color:color-mix(in oklab, var(--color-pine) 90%, transparent)}
stone\/60{border-color:#c4b79e99}
stone\/60{border-color:color-mix(in oklab, var(--color-stone) 60%, transparent)}
```

so alpha is 0.9 (or 230/255 = 0.902 on the fallback path) and 0.6 respectively. The full
script and its raw output are in §11.

### 7.2 Text sizes in play (for choosing the threshold)

From `src/index.css:87–110`:

| Step | Computed size | Used at weight | Large text (≥24px, or ≥18.66px bold)? |
| --- | --- | --- | --- |
| display-xl | `clamp(2.75rem, 7vw, 5rem)` = 44–80px | 600 | yes at every width |
| display-lg | `clamp(2rem, 4.2vw, 3rem)` = 32–48px | 600 | yes at every width |
| display-md | `clamp(1.25rem, 2.2vw, 1.5rem)` = 20–24px | 600 | **no** at its 20px floor |
| lede | `clamp(1.125rem, 1.6vw, 1.375rem)` = 18–22px | 400 / 500 | **no** (below 24px, not bold) |
| body | `1.0625rem` = 17px | 400 / 500 | no |
| caption | `0.875rem` = 14px | 400 / 500 | no |
| eyebrow | `0.75rem` = 12px | 500 | no |

Because every colour pair on the page is used at **at least one** normal-text size, the
**4.5:1** threshold is the binding one for all text rows below. Applying the 3:1 large-text
allowance never changes an outcome here — every text pair clears 4.5:1 anyway. Note that
`font-medium` (500) is not treated as bold; nothing on the page uses 700.

### 7.3 The table

Every foreground/background pair in use, from Phase 3 §5 plus this phase's own sweep.
Ratios to two decimals; "3 non-text" means the 1.4.11 threshold.

| # | Foreground | Background | `file:line` (fg / bg) | Ratio | Threshold applied | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `pine` text | `cloud` | `IntroSection.tsx:40` / `IntroSection.tsx:34` | **6.83:1** | 4.5 (normal text — h1 is large, but the same pair carries 17px body) | **PASS** |
| 2 | `pine` text | `cloud` | `Layout.tsx:99,103` / `AboutSection.tsx:29`, `QuestionsSection.tsx:32` | **6.83:1** | 4.5 | **PASS** |
| 3 | `pine` text | `cloud` | `AboutSection.tsx:50` / `AboutSection.tsx:44` | **6.83:1** | 4.5 | **PASS** |
| 4 | `pine` text | `cloud` | `QuestionsSection.tsx:47,50` / `QuestionsSection.tsx:32` | **6.83:1** | 4.5 | **PASS** |
| 5 | `pine` text (page default) | `cloud` | `App.tsx:27` / `App.tsx:27` | **6.83:1** | 4.5 | **PASS** |
| 6 | `pine` link, resting | `cloud` | `ExternalLink.tsx:33` / `SiteHeader.tsx:47` | **6.83:1** | 4.5 | **PASS** |
| 7 | `pine` link, resting | `cloud` | `ExternalLink.tsx:33` via `ContactSection.tsx:7–9` / `ContactSection.tsx:17` | **6.83:1** | 4.5 | **PASS** |
| 8 | `pine/90` text (= `#4f6b59` over cloud) | `cloud` | `Layout.tsx:74` / `AboutSection.tsx:29` | **5.38:1** | 4.5 (12px eyebrow) | **PASS** |
| 9 | `pine/90` text | `cloud` | `IntroSection.tsx:53` / `IntroSection.tsx:34` | **5.38:1** | 4.5 (14px caption) | **PASS** |
| 10 | `pine/90` text | `cloud` | `AboutSection.tsx:51` / `AboutSection.tsx:44` | **5.38:1** | 4.5 | **PASS** |
| 11 | `pine/90` text | `cloud` | `ContactSection.tsx:34,47` / `ContactSection.tsx:17` | **5.38:1** | 4.5 | **PASS** |
| 12 | **`brick` text, hover** | `cloud` | `ExternalLink.tsx:33` / `SiteHeader.tsx:47`, `ContactSection.tsx:17` | **4.78:1** | 4.5 (17px nav link) | **PASS** |
| 13 | `pine` text | `frost` | `GetInvolvedSection.tsx:37,40` / `GetInvolvedSection.tsx:34` | **5.76:1** | 4.5 | **PASS** |
| 14 | `pine` link, resting | `frost` | `ExternalLink.tsx:37` / `SiteFooter.tsx:21` | **5.76:1** | 4.5 (14px caption) | **PASS** |
| 15 | `pine` link, resting | `frost` | `ExternalLink.tsx:37` via `GetInvolvedSection.tsx:60` / `GetInvolvedSection.tsx:34` | **5.76:1** | 4.5 | **PASS** |
| 16 | `pine/90` text (= `#4c6a58` over frost) | `frost` | `SiteFooter.tsx:26,42` / `SiteFooter.tsx:21` | **4.62:1** | 4.5 (14px caption) | **PASS** (margin 0.12) |
| 17 | `pine/90` text | `frost` | `Layout.tsx:74` via `SiteFooter.tsx:60` / `SiteFooter.tsx:21` | **4.62:1** | 4.5 (12px eyebrow) | **PASS** (margin 0.12) |
| 18 | `pine/90` text | `frost` | `GetInvolvedSection.tsx:55` / `GetInvolvedSection.tsx:34` | **4.62:1** | 4.5 | **PASS** (margin 0.12) |
| 19 | `pine` glyph stroke, hover state | `frost` | `SiteHeader.tsx:77,127` / `SiteHeader.tsx:77` (`hover:bg-frost`) | **5.76:1** | 3 non-text (icon identifying a control) | **PASS** |
| 20 | **`cloud` text** | **`brick`** | `ButtonLink.tsx:30` / `ButtonLink.tsx:30`, rendered at `SiteHeader.tsx:66,104`, `IntroSection.tsx:50`, `GetInvolvedSection.tsx:46` | **4.78:1** | 4.5 (14px caption at size `sm`; 500 weight is not bold) | **PASS** — the one pair no source comment had ever measured |
| 21 | **`cloud` text, CTA hover** | **`pine`** | `ButtonLink.tsx:30` / `ButtonLink.tsx:30` | **6.83:1** | 4.5 | **PASS** |
| 22 | `pine` glyph stroke | `cloud` | `SiteHeader.tsx:127` / `SiteHeader.tsx:47` | **6.83:1** | 3 non-text | **PASS** |
| 23 | `pine` focus ring, offset 4 | `cloud` | `ExternalLink.tsx:30`, `SiteHeader.tsx:51`, `App.tsx:30` / `SiteHeader.tsx:47`, `App.tsx:27` | **6.83:1** | 3 non-text (1.4.11) | **PASS** |
| 24 | `pine` focus ring, offset 2 | `cloud` | `ButtonLink.tsx:31` / `SiteHeader.tsx:47,90`, `IntroSection.tsx:34` | **6.83:1** | 3 non-text | **PASS** |
| 25 | `pine` focus ring, offset 4 | `frost` | `ExternalLink.tsx:30` via `SiteFooter.tsx:14` / `SiteFooter.tsx:21` | **5.76:1** | 3 non-text | **PASS** |
| 26 | `pine` focus ring, offset 2 | `frost` | `ButtonLink.tsx:31` via `GetInvolvedSection.tsx:46` / `GetInvolvedSection.tsx:34` | **5.76:1** | 3 non-text | **PASS** |
| 27 | `brick` button fill | `cloud` | `ButtonLink.tsx:30` / `SiteHeader.tsx:47,90`, `IntroSection.tsx:34` | **4.78:1** | 3 non-text (the fill is what identifies the button) | **PASS** |
| 28 | `brick` button fill | `frost` | `ButtonLink.tsx:30` / `GetInvolvedSection.tsx:34` | **4.03:1** | 3 non-text | **PASS** |
| 29 | `pine` button fill, hover | `cloud` | `ButtonLink.tsx:30` / `SiteHeader.tsx:47` | **6.83:1** | 3 non-text | **PASS** |
| 30 | `pine` button fill, hover | `frost` | `ButtonLink.tsx:30` / `GetInvolvedSection.tsx:34` | **5.76:1** | 3 non-text | **PASS** |
| 31 | **`frost` border — menu button boundary** | `cloud` | `SiteHeader.tsx:77` / `SiteHeader.tsx:47` | **1.19:1** | 3 non-text — **but not required here**: the pine glyph inside identifies the control at 6.83:1 (row 22), and 1.4.11 asks only that *some* visual information identifying the component reach 3:1 | **no SC failure**; the boundary is invisible → **P4-2** |
| 32 | **`frost` fill — menu button hover state** | `cloud` | `SiteHeader.tsx:77` / `SiteHeader.tsx:47` | **1.19:1** | n/a — 1.4.11 does not require hover feedback to meet a ratio | **no SC failure**; feedback is invisible → **P4-2** |
| 33 | `frost` border — card / rule edges | `cloud` | `AboutSection.tsx:44`, `QuestionsSection.tsx:41,45`, `SiteHeader.tsx:47,90` | **1.19:1** | n/a — decorative separators, not UI-component boundaries and not graphics required to understand content | **no SC failure** (cosmetic) |
| 34 | **`frost` border on `frost` fill** | `frost` | `GetInvolvedSection.tsx:34` | **1.00:1** | n/a — same reasoning as row 33; a border that cannot exist | **no SC failure** → **P4-3** |
| 35 | `stone/60` hairline (= `#cec9bc` over frost) | `frost` | `SiteFooter.tsx:37`, `GetInvolvedSection.tsx:55` | **1.28:1** | n/a — decorative rule | **no SC failure** (cosmetic) |
| 36 | `cloud` drift shape | `frost` | `SnowdriftDivider.tsx:31,35,44,48,57,61` / `:27,41,54` | **1.19:1** | n/a — `aria-hidden` decoration (`:84`) | **exempt** |
| 37 | `frost` drift shape | `cloud` | `SnowdriftDivider.tsx:72` / `:69` | **1.19:1** | n/a — `aria-hidden` decoration | **exempt** |
| 38 | `fern` logo mark | `cloud` | `Wordmark.tsx:52,56` / `SiteHeader.tsx:47` | **3.27:1** | n/a — logotype; 1.4.3 exempts logotypes, and the lockup is not the sole identifier of its link (it carries `aria-label="HackBU"`, `Wordmark.tsx:48`) | **exempt** |
| 39 | `fern` logo mark | `frost` | `Wordmark.tsx:52,56` / `SiteFooter.tsx:21` | **2.75:1** | n/a — logotype | **exempt** |
| 40 | `haze` on `cloud` / on `frost` | — | token declared `src/index.css:49`; **no occurrence in `src/` outside the declaration** | **2.72:1** / **2.29:1** | 4.5 if it were text | **not in use** — source claim at `src/index.css:44–47` confirmed exactly |
| 41 | anything on `sky` | `sky` | `Hero.tsx:176` is the only `sky` occurrence; the hero carries no text and no focusable element | — | — | **no pair exists** |

**Every text pair on the page clears 4.5:1. There are no contrast FAIL rows against an
applicable success criterion.** Rows 31–37 are sub-3:1 but none of them is load-bearing
visual information under 1.4.11; they are recorded as design defects (P4-2, P4-3) rather
than conformance failures.

### 7.4 Source claims re-derived, not inherited

| Claim in source | Stated | This phase | Verdict |
| --- | --- | --- | --- |
| `src/index.css:44–47` — `haze` on cloud / frost | 2.72 / 2.29 | 2.72 / 2.29 | exact |
| `src/index.css:44–47` — `pine/90` on cloud / frost | 5.36 / 4.65 | **5.38 / 4.62** | correct to within compositing rounding — see below |
| `src/index.css:62` — `fern` on cloud / frost | 3.27 / 2.75 | 3.27 / 2.75 | exact |
| `src/components/ExternalLink.tsx:14,17` — `brick` on cloud / frost | 4.78 / 4.03 | 4.78 / 4.03 | exact |
| `src/components/ExternalLink.tsx:24`, `ButtonLink.tsx:21–22` — pine ring on cloud / frost | 6.83 / 5.76 | 6.83 / 5.76 | exact |
| `src/components/sections/IntroSection.tsx:12` — pine 6.83, pine/90 5.36 on cloud | 6.83 / 5.36 | 6.83 / **5.38** | same rounding note |
| `README.md:196` — `haze` 2.72 on cloud | 2.72 | 2.72 | exact |

The two `pine/90` numbers are the only ones that move, and the reason is mechanical, not an
error: the source figures were computed on the **unrounded** composite, this phase's on the
composite **rounded to 8 bits**, which is what a compositor actually stores and what a
contrast checker sampling the rendered pixel would read.

```
pine/90 on cloud: unrounded 5.3646   rounded(79,107,89)  5.3775
pine/90 on frost: unrounded 4.6473   rounded(76,106,88)  4.6210
```

Neither reading crosses 4.5:1, so the conclusion in the source comment stands. On the
non-`color-mix` fallback path (alpha 230/255) the same pairs measure 5.40 and 4.68 — also
passing. The frost case has 0.12 of headroom in the worst reading; any future darkening of
`frost` or lightening of the tint will break it, which is worth knowing before someone
tunes either token.

---

## 8. Touch-target size (2.5.8 Target Size (Minimum), AA — 24×24 CSS px)

Derived from padding, height and gap classes; **not measured in a browser**. Tailwind
spacing: `p-2` = 8px, `py-2` = 8px, `py-3` = 12px, `py-4` = 16px, `sm:py-5` = 20px,
`gap-1` = 4px, `gap-3` = 12px, `gap-4` = 16px, `gap-8` = 32px.

A note on which elements are blockified: an `<a>` that is a **direct child of a flex
container** becomes a block-level flex item, so its box height is its line box. That is the
case for the desktop nav links (`SiteHeader.tsx:56` is `md:flex`), the compact panel links
(`:93` is `flex flex-col`), and the footer mail link (`SiteFooter.tsx:37` is `flex`). It is
**not** the case for the footer column links, which are inline inside `<li>` flex items.

| Target | Computed size | `file:line` | Verdict |
| --- | --- | --- | --- |
| Skip link (focused) | inherits 16px / 1.5 line-height = 24px, + `focus:py-2` 16px ⇒ **≈40px** tall | `src/App.tsx:30` | **PASS** |
| Header logo link | wraps a lockup 30px tall (`text-2xl`) / 37.5px (`sm:text-3xl`) | `src/components/SiteHeader.tsx:49–53`, `Wordmark.tsx:36` | **PASS** |
| Desktop nav link | flex item; 17px × 1.65 = **28.05px** tall, ~60–80px wide | `src/components/SiteHeader.tsx:27,56,61` | **PASS** directly |
| Header CTA (`sm`) | 14px × 1.5 = 21px + `py-2` 16px = **37px** tall, + `px-4` | `src/components/ButtonLink.tsx:34`, `SiteHeader.tsx:66` | **PASS** |
| Mobile menu button | 24px glyph + `p-2` 16px + 2px border = **≈42×42px** | `src/components/SiteHeader.tsx:77,125` | **PASS** |
| Compact nav link | flex item; 28.05px + `py-3` 24px = **≈52px** tall | `src/components/SiteHeader.tsx:98` | **PASS** |
| Compact CTA (`md`) | 28.05px + `py-3` 24px = **≈52px** tall | `src/components/ButtonLink.tsx:35`, `SiteHeader.tsx:104` | **PASS** |
| Intro CTA (`lg`) | 18–22px × 1.55 = 27.9–34.1px + `py-4` 32px = **≈60–66px** | `src/components/ButtonLink.tsx:36`, `IntroSection.tsx:50` | **PASS** |
| Get-involved CTA (`lg` + `sm:py-5`) | **≈68–74px** tall, full width below `sm` | `src/components/sections/GetInvolvedSection.tsx:46–52` | **PASS** |
| Contact links (mail + resources) | `inline-block`, 20–24px × 1.25 = **25–30px** tall | `src/components/sections/ContactSection.tsx:7–9,32,43` | **PASS** |
| **Footer column links** (13) | inline `<a>`; hit box ≈ font content area ≈ 14 × 1.21 = **≈17px** — under 24 | `src/components/SiteFooter.tsx:14,64`, list at `:61` | **PASS via the spacing exception** — see below |
| **Footer mail link** | flex item; 14px × 1.5 = **21px** — under 24 | `src/components/SiteFooter.tsx:38–41` | **PASS via the spacing exception** |
| Mailing-list link | inline `<a>` inside a sentence of caption copy | `src/components/sections/GetInvolvedSection.tsx:55–64` | **PASS — Inline exception** applies verbatim |

**Spacing-exception arithmetic for the footer column links.** `<li>` height = the caption
line box = 14 × 1.5 = 21px; `gap-3` adds 12px; adjacent link centres are therefore 33px
apart. A 24px-diameter circle centred on each has radius 12, and 33 > 24, so the circles do
not intersect. The nearest edge of the neighbouring target sits 33 − 8.47 = **24.53px** from
the centre, comfortably outside the 12px radius. Horizontally the columns are separated by
`gap-12` / `md:gap-8` (`SiteFooter.tsx:23`). The exception holds. The footer mail link's
nearest other target is the column list above it, `mt-14` + `pt-8` = 88px away
(`SiteFooter.tsx:37`) — no contest.

**Result: 2.5.8 PASS**, with three targets passing only through the spacing or inline
exception rather than on their own size. Those three are the ones to measure live —
**P4-6**.

---

## 9. Findings

### P4-1 — low — Every link on the page opens in a new tab with no notice, including same-site destinations

**Evidence.** `src/components/ExternalLink.tsx:52` hard-wires
`target="_blank" rel="noopener noreferrer"` for all 24 off-site links, including the three
header nav links (`SiteHeader.tsx:58–64`), their three compact-panel duplicates (`:95–102`)
and the eight hackbu.org page links in the footer (`SiteFooter.tsx:64` over `SITE_PAGES`,
`src/lib/links.ts:23–32`). No link carries visually-hidden "opens in a new tab" text, an
`aria-label`, or a `title`; the sweep for `title=` returns only React component props.

**Expected.** WCAG **3.2.5 Change on Request** (Level **AAA**, technique G201) asks that a
new window be opened only on request, or that the user be told in advance. This is above
the AA bar this audit measures, so it is **not a conformance failure** — but it is the one
place where the page's behaviour will surprise a screen-reader or magnifier user, and eight
of the destinations are the club's own other pages, where a new tab has no rationale at all.
The `rel` hardening itself is correct and is the reason a single component exists.

**Fix.** Add a visually-hidden suffix inside `ExternalLink`, or give the component an
`external` flag so hackbu.org destinations navigate in place.

---

### P4-2 — low — The mobile menu button's boundary and hover feedback are both invisible (1.19:1)

**Evidence.** `src/components/SiteHeader.tsx:77` gives the toggle a `frost` border and a
`frost` hover fill on the header's `cloud` background (`SiteHeader.tsx:47`). Both measure
**1.19:1** (rows 31–32 of §7.3).

**Expected.** **1.4.11 Non-text Contrast (AA)** requires 3:1 for visual information needed
to identify a control. It is **met here** by the pine glyph inside the button, which
measures 6.83:1 against cloud (row 22) — the criterion asks that *some* identifying visual
information reach 3:1, not that every part of the control does. So this is not a failure.
What it is: a pill border and a hover state that no sighted user can see, which removes the
only affordance cue distinguishing the toggle from a bare icon and removes hover feedback
entirely. Related to **P3-1**, which flagged the same declaration as a third, undocumented
hover treatment.

**Fix.** Move the boundary to `stone` (or a pine tint) and use a hover fill with real
separation from cloud.

---

### P4-3 — low — `frost` border painted on a `frost` fill: 1.00:1, a border that cannot render

**Evidence.** `src/components/sections/GetInvolvedSection.tsx:34` applies both a `frost`
border and a `frost` background to the conversion card. Ratio **1.00:1** (row 34).

**Expected.** **1.4.11 (AA)** does not reach it — a card's outer edge is neither a UI
component boundary nor a graphic required to understand the content, and the card is
identified by its fill against the section's cloud background (1.19:1, also invisible, but
the card is not a control). So: **no conformance failure**, but a declaration that does
nothing and reads as an intent that was never realised. Phase 3 §5 flagged the same pair.

**Fix.** Drop the border, or match the `stone/60` hairline already used inside the same
card at `GetInvolvedSection.tsx:55`.

---

### P4-4 — low — The cloud drift runs forever with no in-page pause, stop or hide control

**Evidence.** `src/components/HeroClouds.tsx:691–702` returns a transition with
`repeat: Number.POSITIVE_INFINITY` and `ease: 'linear'`, applied to every layer at `:755`.
Layer periods are 188s, 129s and 90s (`HeroClouds.tsx:227,274,321`). The animation starts on
mount, is presented in parallel with the campus illustration, and — while the page is at
rest at the top — never stops. The scroll-linked fade only zeroes the layers once the user
has scrolled (opacity reaches 0 by 0.30 of the track, `HeroClouds.tsx:722`,
`:229–230,276–277,323–324`), which is a consequence of scrolling, not a control.

**Expected.** **2.2.2 Pause, Stop, Hide (Level A)**: moving content that starts
automatically, lasts more than five seconds, and is presented in parallel with other
content needs a mechanism to pause, stop or hide it. Two defensible readings:

- **Met.** WCAG's definition of *mechanism* explicitly permits one "relied upon to be
  provided by either the platform or by user agents". The page responds fully to
  `prefers-reduced-motion` (`HeroClouds.tsx:731–743`), which is exactly such a platform
  mechanism, and the reduced-motion branch is a genuine static resting frame, not a frozen
  animation.
- **Not met.** The OS setting is not discoverable from the page, is all-or-nothing across
  every site, and the Understanding document's techniques are all in-content controls.

Given the drift is decorative, extremely slow, and disappears on the first scroll, the risk
is low — but this is the single criterion most likely to be cited against the page in a
formal audit, and it is Level A.

**Fix.** Either stop the drift once the layers have faded out, or add a small visible
pause control to the hero.

---

### P4-5 — note — Fixed opaque header vs. focus visibility needs a live check (2.4.11)

**Evidence.** The header is `fixed`, opaque `cloud`, `z-index: 50`, 64px tall below `sm`
and 80px from `sm` up (`src/components/SiteHeader.tsx:47,48`). The mitigation is
`scroll-padding-top: 6rem` (96px) on `html` (`src/index.css:20–24`), documented at
`src/index.css:12–19` as covering sequential focus navigation as well as anchor jumps;
section anchors additionally carry a 6rem scroll margin (`src/components/Layout.tsx:44`).
96px > 80px, so the reserved gutter exceeds the header at every breakpoint.

**Expected.** **2.4.11 Focus Not Obscured (Minimum) (AA)** — no part of a focused component
may be *entirely* hidden by author-created content. `scroll-padding` only helps when the
browser actually scrolls; an element already partly on screen under the header does not
trigger a scroll. Static reading says this is fine, but it is a behaviour, not a
declaration.

**Fix.** None if Phase 7 confirms; otherwise raise the scroll padding or make the header
non-opaque on focus.

---

### P4-6 — note — unverified: three targets pass 2.5.8 only through an exception, on derived numbers

**Evidence.** Footer column links (`src/components/SiteFooter.tsx:14,61,64`) compute to a
~17px inline hit box; the footer mail link (`SiteFooter.tsx:38–41`) to a 21px flex item.
Both are below the 24×24 minimum and clear it only via the spacing exception, with the
arithmetic in §8. The inline box height in particular depends on Inter's font metrics
(ascender + descender ≈ 1.21em), which no static reading can settle.

**Expected.** **2.5.8 Target Size (Minimum) (AA)**. The exception is almost certainly
satisfied — the margins are 24.5px against a 12px radius — but it is the only place in the
page where conformance rests on a measurement rather than a declaration.

**Fix.** None expected; confirm with a live bounding-box measurement in Phase 7.

---

### P4-7 — note — The hero region's label restates what the illustration's alt already says

**Evidence.** `src/components/Hero.tsx:172` names the region "Campus illustration"; the
`<img>` one level down carries a 34-word description of the same picture
(`Hero.tsx:203`, `src/lib/images.ts:64–67`). A screen reader entering the region announces
the short label, then the long alt.

**Expected.** No failure — **1.1.1 (A)** is satisfied by the alt and **1.3.1 (A)** by the
region. The rationale is written out at `Hero.tsx:169–171` and is coherent. Recorded only
because it is mild redundancy at the very top of the reading order, where a screen-reader
user is least patient.

**Fix.** Optional: drop the region label and let the illustration speak, or shorten the alt
now that the region names the subject.

---

### P4-8 — note — Display line-heights sit below 1.5; 1.4.12 wants a live reflow check

**Evidence.** `src/index.css:88` (1.02), `:92` (1.08), `:96` (1.25) — the three display
steps. Body and caption are already at or above 1.5 (`:103` = 1.65, `:106` = 1.5).

**Expected.** **1.4.12 Text Spacing (AA)** does not require any particular authored
line-height; it requires that nothing break when a user overrides line-height to 1.5×,
letter-spacing to 0.12em, word-spacing to 0.16em and paragraph spacing to 2×. No fixed
heights were found on any text container (containers use max-widths and padding only —
`Layout.tsx:22,95`, `AboutSection.tsx:44`, `GetInvolvedSection.tsx:34`), so headings should
simply grow taller. The `text-balance` on three headlines
(`IntroSection.tsx:40`, `Layout.tsx:99`, `QuestionsSection.tsx:47`) is the only thing that
interacts with the override in a way worth seeing.

**Fix.** None expected; verify in Phase 7 with a text-spacing bookmarklet.

---

### P2-4 (carried from Phase 2) — evaluated here: `<main>` is not focusable, so the skip link relies on the focus-navigation starting point

**Evidence.** `src/App.tsx:28–33` is the skip link (`href="#main"`); `src/App.tsx:37` is
`<main id="main">` with no `tabIndex`. A repo-wide sweep
(`grep -rn "tabIndex\|tabindex" src/ index.html`, excluding `src/sheet/`) returns **no
matches at all** — no element on the page sets a tab index.

**Assessment under 2.4.1 Bypass Blocks (Level A).** The mechanism exists and is the first
focusable element in the document, so the criterion is **met on the letter**. The gap is
behavioural: activating a fragment link whose target is not focusable moves the
*sequential focus navigation starting point* but does not move focus. Chrome, Edge and
Firefox implement the starting point, so the next Tab lands inside `<main>`, and NVDA and
JAWS move the virtual cursor to the target regardless. Safari historically does not move
the starting point for a non-focusable target unless Full Keyboard Access is enabled,
which is where this can silently do nothing. `tabIndex={-1}` on `<main>` removes the
browser dependency entirely and is the standard technique (H69 / G1). Severity stays
**low**, matching Phase 2.

Two related things checked and found clean: the skip link's own focus styling survives
Tailwind's cascade (§5, item 2), and its destination is sound — `<main>` opens with the
hero, which contains **no focusable elements at all**, so the next Tab after the skip goes
straight to the first link in the intro section rather than through 260dvh of illustration.

---

## 10. Checked and clean

Everything below was inspected and produced no finding.

- **`lang`, `<title>`, viewport zoom** — §1. No `user-scalable=no`, no `maximum-scale`.
- **One `h1`, no skipped heading levels, no phantom headings from eyebrows** — §2.2.
- **Landmark uniqueness** — one banner, one main, one contentinfo; the nested `<header>` in
  `Layout.tsx:95` correctly does not become a second banner; both `<nav>`s uniquely labelled.
- **All nine graphics have correct alt / accessible-name treatment** — §3, including both
  CSS-mask brand marks, which are named once via `role="img"` + `aria-label` on their
  wrapper (`Wordmark.tsx:47–48`).
- **`rel="noopener noreferrer"` on every `target="_blank"` link**, structurally guaranteed
  by `ExternalLink.tsx:52`; `mailto:` links correctly excluded (`ExternalLink.tsx:66–69`).
- **Every interactive element type has an explicit visible focus indicator** — §5. No
  `outline: none` anywhere; the utilities verifiably compile to a 2px solid ring; the skip
  link's positioning wins the cascade against `not-sr-only`.
- **Focus ring contrast** — 6.83:1 on cloud, 5.76:1 on frost, both above the 3:1 bar of
  **1.4.11**; ring is 2px with a 2–4px offset, which also satisfies the thickness half of
  **2.4.13 Focus Appearance (AAA)** for what it is worth.
- **Reduced motion honoured in all five animated components**, with the hero also returning
  its 260dvh of bought scroll (`Hero.tsx:176`) — §6.
- **`Reveal` never hides content from AT** — opacity and transform only, no `visibility`,
  no `display` — §6.
- **All text contrast clears 4.5:1** — §7.3, forty-one pairs.
- **Mobile menu disclosure** — `aria-expanded` (`SiteHeader.tsx:74`) tracks state,
  `aria-controls="primary-menu"` (`:75`) resolves to a panel that is always mounted
  (`:87–88`, rationale at `:86`), Escape closes and returns focus to the toggle
  (`:33–44`, focus restore at `:40` with the reasoning at `:38–39`), the button is a real
  `<button type="button">` (`:71–73`) with an sr-only name that flips between "Open menu"
  and "Close menu" (`:79–81`), and the panel follows the toggle in DOM order so Tab reaches
  it naturally. No focus trap — correct for a non-modal disclosure. **4.1.2 (A)**,
  **2.1.1 Keyboard (A)**, **2.1.2 No Keyboard Trap (A)** all PASS.
- **2.5.7 Dragging Movements (AA)** — no drag interaction exists; both images explicitly set
  `draggable={false}` (`Hero.tsx:206`, `HeroClouds.tsx:621`).
- **2.3.1 Three Flashes (A)** — nothing flashes; the slowest drift period is 90s.
- **1.4.4 Resize Text (AA)** — the four fluid steps are `clamp()` with `rem` floors
  (`src/index.css:87,91,95,99`), and per CSS Values a `clamp()` whose minimum exceeds its
  maximum returns the minimum, so at 200% text-only zoom the `rem` floor doubles and wins.
  Text scales; a bare `vw` size would not have.
- **3.2.3 / 3.2.4 Consistent Navigation and Identification (AA)** — one nav list rendered
  from one constant (`src/lib/links.ts:16–20`) in both the desktop bar and the compact
  panel; every "Discord" / "Join the Discord" control points at `DISCORD_URL`
  (`src/lib/links.ts:8`).
- **3.3.x, 3.2.6, 3.2.2** — no forms, no inputs, no help mechanism, no on-focus context
  change. Sweep for `<input`, `<form`, `<select`, `<textarea` returns nothing.
- **2.4.5 Multiple Ways (AA)** — arguably N/A for a single-page site; the footer's eight
  page links plus the header nav are the page's own wayfinding.
- **1.4.13 Content on Hover or Focus (AA)** — nothing appears on hover or focus; the only
  hover effects are colour and underline changes.

---

## 11. Commands run

Read-only throughout. Nothing under `src/`, `public/`, `dist/`, `index.html` or any config
file was created or modified; the only file written by this phase is
`audit/04-accessibility.md`, plus two helper scripts in the session scratchpad.

```
ls -la
ls -la audit/
find src -type f | sort
cat -n index.html
for f in src/App.tsx src/main.tsx src/components/Layout.tsx src/components/SiteHeader.tsx src/components/SiteFooter.tsx src/components/Wordmark.tsx; do echo "===== $f ====="; cat -n "$f"; done
wc -l src/components/*.tsx src/components/sections/*.tsx src/lib/*.ts src/index.css src/landing.css
sed -n '28,80p' src/components/ExternalLink.tsx
sed -n '1,27p' src/components/ButtonLink.tsx
cat -n src/components/Hero.tsx
cat -n src/lib/images.ts
cat -n src/lib/links.ts
cat -n src/lib/motion.ts
cat -n src/components/Reveal.tsx
cat -n src/components/SnowdriftDivider.tsx
grep -n "aria-\|alt=\|<img\|<picture\|role=\|reducedMotion\|usePrefersReducedMotion\|useHeroScroll\|prefers-reduced\|<source\|loading=\|decoding=\|draggable\|motion\." src/components/HeroClouds.tsx
sed -n '480,520p;580,680p;700,787p' src/components/HeroClouds.tsx
grep -n "^function \|^export function \|^const CLOUD_LAYERS\|driftLoop\|data-hero-clouds\|repeat:\|ease:" src/components/HeroClouds.tsx
sed -n '686,712p' src/components/HeroClouds.tsx
grep -n "fadeStart\|fadeEnd\|driftSeconds:\|opacity:" src/components/HeroClouds.tsx
cat -n src/components/sections/IntroSection.tsx
cat -n src/components/sections/AboutSection.tsx
cat -n src/components/sections/GetInvolvedSection.tsx
cat -n src/components/sections/QuestionsSection.tsx
cat -n src/components/sections/ContactSection.tsx
cat -n src/index.css
cat -n src/landing.css
grep -n -i "campus" README.md
grep -n -i "decorat\|alt text\|content, not" README.md ASSETS.md
grep -n -i "alt\b\|accessib\|a11y\|screen reader\|WCAG\|contrast" README.md
grep -rn -i "is content\|not decoration\|CAMPUS_ALT\|description of what" README.md ASSETS.md src/ --include=*.md --include=*.ts --include=*.tsx | grep -v sheet
grep -rn "motion" src/components/SiteHeader.tsx src/components/SiteFooter.tsx src/components/Layout.tsx src/components/Wordmark.tsx src/components/SnowdriftDivider.tsx src/App.tsx
ls dist/assets/
cd dist/assets && grep -o "\[hidden\][^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "\.sr-only{[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "\-\-tw-outline-style:[a-z]*" index-CePBE3nM.css | sort -u
cd dist/assets && grep -o "outline-pine[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "\.text-body{[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "outline-2:[a-z-]*{[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "outline-offset[^;}]*" index-CePBE3nM.css | sort -u
cd dist/assets && grep -o "text-pine[^{]\{0,12\}{[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "stone[^{]\{0,12\}{[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "not-sr-only[^{]*{[^}]*}" index-CePBE3nM.css
cd dist/assets && grep -o "scroll-padding-top:[^;}]*" index-CePBE3nM.css
cd dist/assets && python -c "<byte-offset probe for skip-link cascade order — output in §5>"
grep -rn "outline-none\|outline:none\|outline: none\|focus:outline-\|focus-visible" src/ --include=*.tsx --include=*.css | grep -v "^src/sheet"
grep -rn "tabIndex\|tabindex" src/ index.html
grep -rn "aria-label\|aria-describedby\|aria-live\|role=\|title=" src/ --include=*.tsx | grep -v "^src/sheet"
grep -rn "<input\|<form\|<select\|<textarea\|onDrag\|draggable" src/ --include=*.tsx | grep -v "^src/sheet"
grep -rn "<h1\|<h2\|<h3\|<h4\|<h5\|<h6\|as=\"h2\"" src/ --include=*.tsx | grep -v "^src/sheet"
grep -rn "<header\|<main\|<footer\|<nav\|<section\|<aside" src/ --include=*.tsx | grep -v "^src/sheet"
grep -rn "<img\|<picture\|<svg\|brand-mark" src/ --include=*.tsx | grep -v "^src/sheet"
grep -n "^#\{1,3\} " audit/03-design-system.md
sed -n '475,537p' audit/03-design-system.md
node <scratchpad>/contrast.mjs
node <scratchpad>/alpha-check.mjs
```

`<scratchpad>` is
`C:\Users\danz3\AppData\Local\Temp\claude\C--Users-danz3-Downloads-HackBUNew\3a277e50-bf53-4daa-a1d2-74d9bad28359\scratchpad`.

### 11.1 The contrast script

```js
/* WCAG 2.x contrast, from the spec definitions.
 *   relative luminance:  L = 0.2126R + 0.7152G + 0.0722B
 *     where for each 8-bit channel c:  cs = c/255
 *       cs <= 0.03928 ? cs/12.92 : ((cs+0.055)/1.055)**2.4
 *   contrast ratio:  (Llighter + 0.05) / (Ldarker + 0.05)
 * Alpha foregrounds are composited over the stated background in sRGB
 * (source-over: out = a*fg + (1-a)*bg per 8-bit channel), which is what the
 * browser compositor does for `color: #RRGGBBAA` / color-mix(..., transparent).
 */
const T = {
  sky:'#4a96d2', horizon:'#a8d0eb', cloud:'#f7f5ee', frost:'#dce3ea',
  brick:'#a2593a', stone:'#c4b79e', pine:'#3c5c48', haze:'#7c99b4', fern:'#339966',
}
const rgb = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16))
const lum = ([r,g,b]) => {
  const f = c => { const s = c/255; return s <= 0.03928 ? s/12.92 : ((s+0.055)/1.055)**2.4 }
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b)
}
const over = (fg,bg,a) => fg.map((c,i) => Math.round(a*c + (1-a)*bg[i]))
const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05) }
const hex = c => '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')

// [label, fg token, alpha|1, bg token]
const PAIRS = [
  ['pine on cloud','pine',1,'cloud'],
  ['pine/90 on cloud','pine',0.9,'cloud'],
  ['pine on frost','pine',1,'frost'],
  ['pine/90 on frost','pine',0.9,'frost'],
  ['brick on cloud','brick',1,'cloud'],
  ['brick on frost','brick',1,'frost'],
  ['cloud on brick','cloud',1,'brick'],
  ['cloud on pine','cloud',1,'pine'],
  ['pine outline vs cloud','pine',1,'cloud'],
  ['pine outline vs frost','pine',1,'frost'],
  ['frost vs cloud','frost',1,'cloud'],
  ['frost vs frost','frost',1,'frost'],
  ['stone/60 over frost vs frost','stone',0.6,'frost'],
  ['stone/60 over frost vs cloud','stone',0.6,'cloud'],
  ['brick vs cloud','brick',1,'cloud'],
  ['brick vs frost','brick',1,'frost'],
  ['pine vs cloud (hovered CTA fill)','pine',1,'cloud'],
  ['pine vs frost (hovered CTA fill)','pine',1,'frost'],
  ['fern on cloud','fern',1,'cloud'],
  ['fern on frost','fern',1,'frost'],
  ['haze on cloud','haze',1,'cloud'],
  ['haze on frost','haze',1,'frost'],
  ['cloud vs frost (divider drift)','cloud',1,'frost'],
  ['frost vs cloud (divider drift)','frost',1,'cloud'],
  ['pine/90 hex-fallback #3c5c48e6 on cloud','pine',230/255,'cloud'],
  ['pine/90 hex-fallback #3c5c48e6 on frost','pine',230/255,'frost'],
]
for (const [label,f,a,b] of PAIRS) {
  const bg = rgb(T[b]), fgc = a === 1 ? rgb(T[f]) : over(rgb(T[f]), bg, a)
  console.log(
    ratio(fgc,bg).toFixed(2).padStart(6) + ':1   ' + label +
    '   [fg ' + hex(fgc) + (a===1?'':' = '+T[f]+' @ '+a) + ' on bg ' + T[b] + ']'
  )
}
```

Output, verbatim:

```
  6.83:1   pine on cloud   [fg #3c5c48 on bg #f7f5ee]
  5.38:1   pine/90 on cloud   [fg #4f6b59 = #3c5c48 @ 0.9 on bg #f7f5ee]
  5.76:1   pine on frost   [fg #3c5c48 on bg #dce3ea]
  4.62:1   pine/90 on frost   [fg #4c6a58 = #3c5c48 @ 0.9 on bg #dce3ea]
  4.78:1   brick on cloud   [fg #a2593a on bg #f7f5ee]
  4.03:1   brick on frost   [fg #a2593a on bg #dce3ea]
  4.78:1   cloud on brick   [fg #f7f5ee on bg #a2593a]
  6.83:1   cloud on pine   [fg #f7f5ee on bg #3c5c48]
  6.83:1   pine outline vs cloud   [fg #3c5c48 on bg #f7f5ee]
  5.76:1   pine outline vs frost   [fg #3c5c48 on bg #dce3ea]
  1.19:1   frost vs cloud   [fg #dce3ea on bg #f7f5ee]
  1.00:1   frost vs frost   [fg #dce3ea on bg #dce3ea]
  1.28:1   stone/60 over frost vs frost   [fg #cec9bc = #c4b79e @ 0.6 on bg #dce3ea]
  1.41:1   stone/60 over frost vs cloud   [fg #d8d0be = #c4b79e @ 0.6 on bg #f7f5ee]
  4.78:1   brick vs cloud   [fg #a2593a on bg #f7f5ee]
  4.03:1   brick vs frost   [fg #a2593a on bg #dce3ea]
  6.83:1   pine vs cloud (hovered CTA fill)   [fg #3c5c48 on bg #f7f5ee]
  5.76:1   pine vs frost (hovered CTA fill)   [fg #3c5c48 on bg #dce3ea]
  3.27:1   fern on cloud   [fg #339966 on bg #f7f5ee]
  2.75:1   fern on frost   [fg #339966 on bg #dce3ea]
  2.72:1   haze on cloud   [fg #7c99b4 on bg #f7f5ee]
  2.29:1   haze on frost   [fg #7c99b4 on bg #dce3ea]
  1.19:1   cloud vs frost (divider drift)   [fg #f7f5ee on bg #dce3ea]
  1.19:1   frost vs cloud (divider drift)   [fg #dce3ea on bg #f7f5ee]
  5.40:1   pine/90 hex-fallback #3c5c48e6 on cloud   [fg #4e6b58 = #3c5c48 @ 0.9019607843137255 on bg #f7f5ee]
  4.68:1   pine/90 hex-fallback #3c5c48e6 on frost   [fg #4c6958 = #3c5c48 @ 0.9019607843137255 on bg #dce3ea]
```

### 11.2 The rounding cross-check

```js
/* Does the 8-bit rounding of the composited pine/90 colour explain the gap
   between src/index.css:44-47's 5.36 / 4.65 and this phase's 5.38 / 4.62? */
const rgb = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16))
const lum = ([r,g,b]) => { const f=c=>{const s=c/255;return s<=0.03928?s/12.92:((s+0.055)/1.055)**2.4}
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b) }
const ratio=(a,b)=>{const[x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05)}
const pine=rgb('#3c5c48')
for (const [name,bgHex] of [['cloud','#f7f5ee'],['frost','#dce3ea']]) {
  const bg=rgb(bgHex)
  const raw = pine.map((c,i)=>0.9*c+0.1*bg[i])            // no 8-bit rounding
  const rnd = raw.map(Math.round)                          // as the compositor stores it
  console.log(`pine/90 on ${name}: unrounded ${ratio(raw,bg).toFixed(4)}  rounded(${rnd.join(',')}) ${ratio(rnd,bg).toFixed(4)}`)
}
```

Output, verbatim:

```
pine/90 on cloud: unrounded 5.3646  rounded(79,107,89) 5.3775
pine/90 on frost: unrounded 4.6473  rounded(76,106,88) 4.6210
```

---

## 12. For Phase 7 (live browser verification)

In priority order.

1. **Skip link end-to-end.** Load, press Tab once, confirm the pill appears at top-left
   above the header, press Enter, then press Tab again and check where focus lands.
   Repeat in Safari if available — that is the browser where the missing `tabIndex={-1}`
   (P2-4) would show. Confirm the pill is positioned (not static) and has its padding.
2. **Focus ring visibility on every element type in §5**, especially: the footer links on
   the frost band (4px offset over a hairline-separated layout), the two large contact
   links (4px offset against an 8px underline offset — check the ring does not merge with
   the underline), and the get-involved CTA whose ring sits 2px outside a brick pill on a
   frost card.
3. **Tab order**, full pass: skip link → logo → (at `md`+) three nav links → header CTA →
   intro CTA → mailing-list link → contact mail link → contact resources link → 13 footer
   links → footer mail link. Confirm nothing in the 260dvh hero is focusable and that the
   hero does not swallow Tab.
4. **2.4.11**: at 1440×900 and 390×844, Shift+Tab upward through the page and confirm no
   focused element is ever *entirely* hidden behind the fixed header. Then scroll so a link
   sits half under the header and Tab to it directly.
5. **Mobile menu at 390px**: open with Enter and with Space; confirm `aria-expanded` flips
   in the AX tree; Tab into the panel; press Escape and confirm focus returns to the
   toggle; confirm the closed panel is absent from the AX tree and the tab order; resize to
   ≥768px with the menu open and confirm nothing is stranded.
6. **Target-size measurement (P4-6)**: read the actual `getBoundingClientRect()` height of
   a footer column link and the footer mail link. Anything at or above 24px retires the
   finding outright.
7. **Reduced motion**: emulate `prefers-reduced-motion: reduce` and confirm (a) the hero
   track is one viewport, not 260dvh, (b) the campus renders at scale 1 with the whole
   illustration visible, (c) the clouds are static and sit in the sky band above the
   ridgeline, (d) section content is at full opacity immediately with no reveal.
8. **Cloud drift (P4-4)**: confirm the drift is running at rest at the top of the page, and
   check whether it continues to consume frames after the layers have faded to zero.
9. **Accessible names in the AX tree**: the header logo link should read "HackBU" (from
   `role="img"` + `aria-label`), the menu button "Open menu" / "Close menu", the hero region
   "Campus illustration", and the campus image should expose the full 34-word alt.
10. **1.4.12 Text Spacing (P4-8)**: apply the standard override and check the three
    `text-balance` headlines and the pillar cards for clipping or overlap.
11. **1.4.10 Reflow** at 320px CSS width / 400% zoom: confirm no horizontal scrolling, and
    watch the display-xl headline at its 44px floor inside the 320px container.
