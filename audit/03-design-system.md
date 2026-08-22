# Phase 3 — Design system / colour audit

Read-only audit of every colour occurrence in `src/**/*.{tsx,ts,css}`, `index.html` and
`components.html`, classified against the nine `@theme` tokens, plus an explicit
PASS/FAIL on the five named colour rules.

Scope note: this phase audits **source**, not `dist/`. Per Phase 1's P1-5, Tailwind's
unscoped source scanning also pulls class-shaped tokens out of `audit/*.md` prose into the
built stylesheet; nothing in this report is derived from the built CSS.

All commands below were run from the repository root (`C:\Users\danz3\Downloads\HackBUNew`)
with the Bash tool. Every `file:line` cited was re-confirmed with `sed -n '<n>p'` after the
greps. Full verbatim command list with output is in **Commands run** at the end.

---

## 0. The palette: nine tokens, one place

`grep -nE '^\s*--color-' src/index.css` → 9 declarations, all inside the single `@theme`
block that opens at `src/index.css:32` and closes at `src/index.css:111`.

| # | Token | Hex | `file:line` | README role (README:183–193) |
| --- | --- | --- | --- | --- |
| 1 | `sky` | `#4a96d2` | `src/index.css:34` | hero sky (README:185) |
| 2 | `horizon` | `#a8d0eb` | `src/index.css:35` | **currently unused** (README:186) |
| 3 | `cloud` | `#f7f5ee` | `src/index.css:36` | page background below the fold (README:187) |
| 4 | `frost` | `#dce3ea` | `src/index.css:37` | dividers, muted surfaces, card fills (README:188) |
| 5 | `brick` | `#a2593a` | `src/index.css:38` | the single accent — links, buttons, hover (README:189) |
| 6 | `stone` | `#c4b79e` | `src/index.css:39` | tertiary / decorative only (README:190) |
| 7 | `pine` | `#3c5c48` | `src/index.css:40` | body text and headings (never pure black) (README:191) |
| 8 | `haze` | `#7c99b4` | `src/index.css:49` | scene colour only (README:192) |
| 9 | `fern` | `#339966` | `src/index.css:67` | **logo only** — the two brand marks (README:193) |

Source hex casing is lower-case in `src/index.css`; the README table and
`src/sheet/parts/TokensPart.tsx` print the same values upper-case. Same colours, no
mismatch — verified value-by-value against `src/sheet/parts/TokensPart.tsx:41,48,58,65,73,80,87,95,105`.

There are **no** other colour definitions anywhere: no `var(--color-*)` reference sites
(command C7, empty), no `rgb()`/`hsl()`/`oklch()`/`color-mix()` (C5), no arbitrary-value
colour utilities `[#…]` (C5), no `shadow-*`/`ring-*`/`backdrop-*` utilities (C11), no
`<meta name="theme-color">` and no `dark:` variants (C10).

---

## 1. Landing page (`src/**` except `src/sheet/`, `index.html`)

### 1.1 Complete occurrence table

Produced by command **C1** (below), filtered to non-sheet paths — 80 raw matches. Each row
is one match. The "Kind" column separates matches that actually paint (`class` = inside a
`className`/class string that reaches the DOM; `const` = inside a shared class-string
constant; `data` = a class name held in a TS data structure and applied via `className`)
from matches that do not (`comment` = prose inside a `/* */` or `//` comment;
`artifact` = the regex matching the middle of a hyphenated identifier such as
`'cloud-to-frost'`, not a `to-*` gradient utility — confirmed by C13, which finds no
gradient utilities anywhere).

| `file:line` | Raw value | Kind | Resolved |
| --- | --- | --- | --- |
| `src/App.tsx:27` | `bg-cloud` | class | `cloud` |
| `src/App.tsx:27` | `text-pine` | class | `pine` |
| `src/App.tsx:30` | `bg-cloud` | class | `cloud` |
| `src/App.tsx:30` | `text-pine` | class | `pine` |
| `src/App.tsx:30` | `focus:outline-pine` | class | `pine` |
| `src/App.tsx:45` | `to-cloud` | artifact (`sky-to-cloud` in prose) | n/a |
| `src/App.tsx:50` | `bg-frost` | comment | `frost` (documentation) |
| `src/App.tsx:71` | `to-frost` | artifact (`variant="cloud-to-frost"`) | n/a |
| `src/components/ButtonLink.tsx:30` | `bg-brick` | const (`BASE`) | `brick` |
| `src/components/ButtonLink.tsx:30` | `text-cloud` | const (`BASE`) | `cloud` |
| `src/components/ButtonLink.tsx:30` | `hover:bg-pine` | const (`BASE`) | `pine` |
| `src/components/ButtonLink.tsx:31` | `focus-visible:outline-pine` | const (`BASE`) | `pine` |
| `src/components/ExternalLink.tsx:30` | `focus-visible:outline-pine` | const (`FOCUS_RING`) | `pine` |
| `src/components/ExternalLink.tsx:33` | `text-pine` | const (`LINK_ON_CLOUD`) | `pine` |
| `src/components/ExternalLink.tsx:33` | `hover:text-brick` | const (`LINK_ON_CLOUD`) | `brick` |
| `src/components/ExternalLink.tsx:37` | `text-pine` | const (`LINK_ON_FROST`) | `pine` |
| `src/components/Hero.tsx:176` | `bg-sky` | class | `sky` |
| `src/components/HeroClouds.tsx:554` | `bg-cloud` | comment | `cloud` (documentation) |
| `src/components/Layout.tsx:74` | `text-pine/90` | class (`Eyebrow`) | `pine` @ 90% |
| `src/components/Layout.tsx:99` | `text-pine` | class (`SectionHeader` h2) | `pine` |
| `src/components/Layout.tsx:103` | `text-pine` | class (`SectionHeader` lede) | `pine` |
| `src/components/SiteFooter.tsx:21` | `bg-frost` | class | `frost` |
| `src/components/SiteFooter.tsx:26` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/SiteFooter.tsx:37` | `border-stone/60` | class | `stone` @ 60% |
| `src/components/SiteFooter.tsx:42` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/SiteHeader.tsx:22` | `bg-cloud` | comment | `cloud` (documentation) |
| `src/components/SiteHeader.tsx:47` | `bg-cloud` | class | `cloud` |
| `src/components/SiteHeader.tsx:47` | `border-frost` | class | `frost` |
| `src/components/SiteHeader.tsx:51` | `focus-visible:outline-pine` | class | `pine` |
| `src/components/SiteHeader.tsx:77` | `border-frost` | class | `frost` |
| `src/components/SiteHeader.tsx:77` | `text-pine` | class | `pine` |
| `src/components/SiteHeader.tsx:77` | `hover:bg-frost` | class | `frost` |
| `src/components/SiteHeader.tsx:77` | `focus-visible:outline-pine` | class | `pine` |
| `src/components/SiteHeader.tsx:90` | `bg-cloud` | class | `cloud` |
| `src/components/SiteHeader.tsx:90` | `border-frost` | class | `frost` |
| `src/components/SiteHeader.tsx:126` | `fill="none"` (SVG attr) | class | keyword, no colour |
| `src/components/SiteHeader.tsx:127` | `stroke="currentColor"` (SVG attr) | class | inherits `text-pine` from `:77` |
| `src/components/SnowdriftDivider.tsx:17` | `to-frost` | artifact (union member `'cloud-to-frost'`) | n/a |
| `src/components/SnowdriftDivider.tsx:28` | `bg-frost` | data (`drift-a` band) | `frost` |
| `src/components/SnowdriftDivider.tsx:31` | `fill-cloud` | data (`drift-a` path) | `cloud` |
| `src/components/SnowdriftDivider.tsx:35` | `fill-cloud` | data (`drift-a` path) | `cloud` |
| `src/components/SnowdriftDivider.tsx:41` | `bg-frost` | data (`drift-b` band) | `frost` |
| `src/components/SnowdriftDivider.tsx:44` | `fill-cloud` | data (`drift-b` path) | `cloud` |
| `src/components/SnowdriftDivider.tsx:48` | `fill-cloud` | data (`drift-b` path) | `cloud` |
| `src/components/SnowdriftDivider.tsx:54` | `bg-frost` | data (`drift-c` band) | `frost` |
| `src/components/SnowdriftDivider.tsx:57` | `fill-cloud` | data (`drift-c` path) | `cloud` |
| `src/components/SnowdriftDivider.tsx:61` | `fill-cloud` | data (`drift-c` path) | `cloud` |
| `src/components/SnowdriftDivider.tsx:68` | `to-frost` | artifact (key `'cloud-to-frost'`) | n/a |
| `src/components/SnowdriftDivider.tsx:69` | `bg-cloud` | data (`cloud-to-frost` band) | `cloud` |
| `src/components/SnowdriftDivider.tsx:72` | `fill-frost` | data (`cloud-to-frost` path) | `frost` |
| `src/components/Wordmark.tsx:52` | `bg-fern` | class (bearcat mark) | `fern` |
| `src/components/Wordmark.tsx:56` | `bg-fern` | class (wordmark mark) | `fern` |
| `src/components/sections/AboutSection.tsx:29` | `bg-cloud` | class | `cloud` |
| `src/components/sections/AboutSection.tsx:44` | `bg-cloud` | class (card) | `cloud` |
| `src/components/sections/AboutSection.tsx:44` | `border-frost` | class (card) | `frost` |
| `src/components/sections/AboutSection.tsx:47` | `text-pine` | class | `pine` |
| `src/components/sections/AboutSection.tsx:50` | `text-pine` | class | `pine` |
| `src/components/sections/AboutSection.tsx:51` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/sections/ContactSection.tsx:17` | `bg-cloud` | class | `cloud` |
| `src/components/sections/ContactSection.tsx:34` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/sections/ContactSection.tsx:47` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/sections/GetInvolvedSection.tsx:14` | `bg-frost` | comment | `frost` (documentation) |
| `src/components/sections/GetInvolvedSection.tsx:22` | `bg-cloud` | class | `cloud` |
| `src/components/sections/GetInvolvedSection.tsx:34` | `bg-frost` | class (card) | `frost` |
| `src/components/sections/GetInvolvedSection.tsx:34` | `border-frost` | class (card) | `frost` |
| `src/components/sections/GetInvolvedSection.tsx:37` | `text-pine` | class | `pine` |
| `src/components/sections/GetInvolvedSection.tsx:40` | `text-pine` | class | `pine` |
| `src/components/sections/GetInvolvedSection.tsx:55` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/sections/GetInvolvedSection.tsx:55` | `border-stone/60` | class | `stone` @ 60% |
| `src/components/sections/IntroSection.tsx:12` | `text-pine` | comment | `pine` (documentation) |
| `src/components/sections/IntroSection.tsx:12` | `text-pine/90` | comment | `pine` @ 90% (documentation) |
| `src/components/sections/IntroSection.tsx:34` | `bg-cloud` | class | `cloud` |
| `src/components/sections/IntroSection.tsx:40` | `text-pine` | class (h1) | `pine` |
| `src/components/sections/IntroSection.tsx:44` | `text-pine` | class (lede) | `pine` |
| `src/components/sections/IntroSection.tsx:53` | `text-pine/90` | class | `pine` @ 90% |
| `src/components/sections/QuestionsSection.tsx:32` | `bg-cloud` | class | `cloud` |
| `src/components/sections/QuestionsSection.tsx:41` | `border-frost` | class | `frost` |
| `src/components/sections/QuestionsSection.tsx:45` | `border-frost` | class | `frost` |
| `src/components/sections/QuestionsSection.tsx:47` | `text-pine` | class | `pine` |
| `src/components/sections/QuestionsSection.tsx:50` | `text-pine` | class | `pine` |
| `src/index.css:34–40, 49, 67` | nine `#rrggbb` literals | `@theme` definition | the nine tokens |
| `src/index.css:46` | `text-pine/90` | comment | `pine` @ 90% (documentation) |
| `src/index.css:55` | `#339966`, `#42B872` | comment | source-art greens, documentation only |
| `src/index.css:117` | `bg-fern` | comment | `fern` (documentation) |
| `src/App.tsx:44` | `#ccc3ad` | comment | **not a token** — measured pixel average, non-shipping (see P3-4) |
| `src/components/ExternalLink.tsx:12` | `#F7F5EE` | comment | `cloud` (documentation) |
| `src/components/ExternalLink.tsx:14` | `#DCE3EA` | comment | `frost` (documentation) |

**Off-palette count in the landing page: 0.** Every value that reaches the DOM resolves to
one of the nine tokens (or to `currentColor`, which resolves to `pine`). The only hex
outside `@theme` that is not a restatement of a token is `#ccc3ad` in a comment
(`src/App.tsx:44`), which paints nothing.

`index.html` contains **no** colour of any kind — no `theme-color`, no inline style, no
`fill`/`stroke`. Confirmed by C1/C5/C9/C10, all of which return zero `index.html` rows.

### 1.2 What is *not* used

- `horizon` — zero occurrences in the landing page. Intentional per README:186
  (“**currently unused** — the sky is a single flat field, not a gradient”). Confirms the
  Phase 2 note about `src/index.css:35`.
- `haze` — zero occurrences in the landing page, in **any** utility, not just `text-*`.
  See P3-3.
- `stone` — used only at `/60`, twice, both as `border-t` hairlines
  (`src/components/SiteFooter.tsx:37`, `src/components/sections/GetInvolvedSection.tsx:55`).
  Consistent with README:190 (“tertiary / decorative only”).
- `sky` — one use, `src/components/Hero.tsx:176`, as the hero track background behind an
  opaque illustration. No text ever sits on it (README:216–218).

### 1.3 Hover inventory (landing)

Command **C2** returns 8 rows repo-wide; 4 are in the landing page.

| `file:line` | Hover declaration | Element | Inside `LINK_ON_*`? |
| --- | --- | --- | --- |
| `src/components/ExternalLink.tsx:33` | `hover:text-brick` | text link on `cloud` | yes — `LINK_ON_CLOUD` |
| `src/components/ExternalLink.tsx:37` | `hover:underline hover:decoration-2 hover:underline-offset-4` | text link on `frost` | yes — `LINK_ON_FROST` (no colour change) |
| `src/components/ButtonLink.tsx:30` | `hover:bg-pine` | the Discord CTA (`<a>` via `ExternalLink`) | no — documented button treatment (README:238) |
| `src/components/SiteHeader.tsx:77` | `hover:bg-frost` | the mobile menu toggle, a real `<button>` (`src/components/SiteHeader.tsx:71`) | no — undocumented (see P3-1) |

---

## 2. The five rules — PASS/FAIL

### Rule 1 — `brick` is the only accent — **PASS**

Rule: README:189 (“the single accent — links, buttons, hover”) and README:195 (“`brick` is
the **only** accent; adding a second one is a design regression”).

`brick` appears exactly twice in the landing page, both interactive:
`src/components/ButtonLink.tsx:30` (`bg-brick`, the CTA fill) and
`src/components/ExternalLink.tsx:33` (`hover:text-brick`, the cloud link hover). No second
saturated/interactive colour exists — C3 and C4 return nothing, and `fern` is confined to
the marks (Rule 2). `pine` also carries interactive state (`hover:bg-pine`,
`focus-visible:outline-pine`), but pine is the page's text/structure colour, not a second
accent; this is a doc gap, not a rule break (P3-2).

### Rule 2 — `fern` is logo-only — **PASS** (landing) / see §3 for the sheet

Rule: README:193 and README:199–202, in particular README:201: “It fills the marks and
nothing else: no link, button, border, background or text.”

`fern` occurrences in the landing page: `src/components/Wordmark.tsx:52` and
`src/components/Wordmark.tsx:56` — the two masked `<span>`s, plus the mask geometry in
`src/index.css:147–177` (`.brand-mark`, `.brand-mark-bearcat`, `.brand-mark-wordmark`,
which carry no colour of their own). The only other hits are the prose comments at
`src/index.css:117` and `src/index.css:55`. No `fern` link, button, border, background or
text anywhere in `src/` outside `src/sheet/`.

### Rule 3 — `haze` is never text — **PASS** (vacuously)

Rule: README:192 (“scene colour only”) + README:195–197 (“`haze` is retired from text
use … Secondary text uses `pine/90`”) + the token comment at `src/index.css:41–48`.

Zero `text-haze` and zero `haze` of any kind in the landing page (C1 returns no landing
`haze` row). Secondary text is `text-pine/90` in all eight places it is applied
(`src/components/Layout.tsx:74`, `src/components/SiteFooter.tsx:26,42`,
`src/components/sections/AboutSection.tsx:51`,
`src/components/sections/ContactSection.tsx:34,47`,
`src/components/sections/GetInvolvedSection.tsx:55`,
`src/components/sections/IntroSection.tsx:53`). Note the rule is satisfied more strongly
than stated — `haze` has no scene use either (P3-3).

### Rule 4 — no off-palette colours, no raw hex outside `@theme` — **PASS**

Rule: README:179–181 (“defined once in the `@theme` block of `src/index.css`, and nothing
else — no arbitrary hex, no default Tailwind palette colours, no `#000000`”).

- Default Tailwind palette utilities (`gray-500`, `blue-600`, `slate-*`, `red-*`, …):
  **zero** — command C3 returns nothing across `src`, `index.html`, `components.html`.
- `black` / `white` / `transparent` / `current` / `inherit` colour utilities: **zero** —
  command C4 returns nothing.
- Arbitrary-value colours (`[#…]`, `[rgb…]`, `[oklch…]`, `[hsl…]`), and any
  `rgb()`/`hsl()`/`oklch()`/`color-mix()`: **zero** — command C5's only hits are the nine
  `@theme` declarations plus hexes inside comments and inside the sheet's token-catalogue
  strings.
- Raw CSS colour declarations (`color:`, `background-color:`, `fill:`, `stroke:`,
  `box-shadow:`, `outline-color:` …): **zero** — command C6's five hits are all the
  TypeScript object property `background:` in `src/components/SnowdriftDivider.tsx`
  (`:21,28,41,54,69`), whose *value* is a Tailwind class string, not a CSS colour.
- `var(--color-*)` reference sites: **zero** — command C7 returns nothing.
- Inline `style` props carrying colour: **zero** — command C9's ten hits carry only
  `scale`, `transform`, `opacity`, `left`/`top`/`bottom`/`width`/`height`, `aspectRatio`
  and the `--cloud-sets` custom property.
- SVG colour attributes: two, both benign — `fill="none"`
  (`src/components/SiteHeader.tsx:126`) and `stroke="currentColor"`
  (`src/components/SiteHeader.tsx:127`), the latter inheriting `text-pine` from the
  button at `src/components/SiteHeader.tsx:77`.
- CSS mask / gradient colour stops: **zero** — the `.brand-mark-*` rules use `mask-image:
  url(...)` only (`src/index.css:158–176`), and C13 finds no gradient utility anywhere.
- `<meta name="theme-color">`: absent from both `index.html` and `components.html` (C10).

The one caveat is `#ccc3ad` in a comment at `src/App.tsx:44` — see P3-4, note severity.

### Rule 5 — link hover lives in exactly one place — **PASS**, with two documented exceptions and one undocumented third treatment

Rule: README:204–207 (“Link hover is a per-surface rule, and it lives in one place.
`LINK_ON_CLOUD` and `LINK_ON_FROST` in `src/components/ExternalLink.tsx` are the only two
link treatments on the page”).

Every **text link** on the page composes one of the two constants:

| Call site | Treatment |
| --- | --- |
| `src/components/SiteHeader.tsx:27` (`NAV_LINK_CLASSES`, used at `:61` and `:98`) | `LINK_ON_CLOUD` |
| `src/components/sections/ContactSection.tsx:7–9` (`LINK_CLASSES`, used at `:32` and `:43`) | `LINK_ON_CLOUD` |
| `src/components/SiteFooter.tsx:14` (`FOOTER_LINK_CLASSES`, used at `:40` and `:64`) | `LINK_ON_FROST` |
| `src/components/sections/GetInvolvedSection.tsx:60` | `LINK_ON_FROST` |

Two links use neither, both documented elsewhere: `ButtonLink`
(`src/components/ButtonLink.tsx:53` renders an `ExternalLink`) is the page's one **button**
treatment per README:238, and the header logo link (`src/components/SiteHeader.tsx:49–52`)
wraps a graphic and carries a focus ring only, no hover. See P3-5 for the wording gap.

The genuine gap is `hover:bg-frost` on the header menu toggle
(`src/components/SiteHeader.tsx:77`) — a hover colour change on a `<button>`, spelled out
inline, in no shared constant. See P3-1.

---

## 3. Component sheet (`src/sheet/**`, `components.html`) — internal, lower stakes

`src/sheet/` does not ship in the landing page's bundle or stylesheet
(README:75–81; `src/landing.css:22`), and `components.html:17` marks the page
`noindex, nofollow`. Violations here affect only an internal tool, so they are reported
separately and rated a full step lower.

### 3.1 Complete occurrence table (sheet)

149 raw matches from **C1** on `src/sheet/`. Grouped by file and raw value; every matching
line number is listed, so the grouping is lossless against C1's output.

| File | Raw value | Lines | Kind | Resolved |
| --- | --- | --- | --- | --- |
| `ComponentSheet.tsx` | `bg-cloud` | 61, 64, 73, 135 | class | `cloud` |
| `ComponentSheet.tsx` | `bg-frost` | 112 | class | `frost` |
| `ComponentSheet.tsx` | `hover:bg-frost` | 95 | class | `frost` |
| `ComponentSheet.tsx` | `border-frost` | 73, 95, 112, 149, 151 | class | `frost` |
| `ComponentSheet.tsx` | `text-pine` | 61, 64, 81, 95, 140, 143, 159 | class | `pine` |
| `ComponentSheet.tsx` | `text-pine/90` | 114, 120, 137, 156, 162 | class | `pine` @ 90% |
| `ComponentSheet.tsx` | `hover:text-brick` | 81 | class | `brick` |
| `ComponentSheet.tsx` | `group-hover:text-brick` | 159 | class | `brick` |
| `ComponentSheet.tsx` | `focus:outline-pine` / `focus-visible:outline-pine` | 64, 81, 95, 154 | class | `pine` |
| `kit.tsx` | `bg-cloud` | 223, 227, 256, 261 | class | `cloud` |
| `kit.tsx` | `bg-frost` | 227 | class | `frost` |
| `kit.tsx` | `border-frost` | 85, 86, 145, 149, 181, 185, 221, 223, 255, 256, 261 | class | `frost` |
| `kit.tsx` | `border-stone/60` | 121 | class | `stone` @ 60% |
| `kit.tsx` | `text-pine` | 58, 62, 87, 91, 121, 151, 187 | class | `pine` |
| `kit.tsx` | `text-pine/90` | 53, 90, 108, 154, 157, 160, 163, 190, 191, 223, 236, 256, 261 | class | `pine` @ 90% |
| `parts/ComposedPart.tsx` | `bg-cloud` | 52 | class | `cloud` |
| `parts/ComposedPart.tsx` | `text-pine` | 23 | class | `pine` |
| `parts/ComposedPart.tsx` | `text-pine/90` | 24, 56 | class | `pine` @ 90% |
| `parts/ComposedPart.tsx` | `to-frost` | 36 | artifact (`cloud-to-frost` in prose) | n/a |
| `parts/HeroPart.tsx` | `bg-sky` | 227 | class (cloud-cutout ground) | `sky` |
| `parts/HeroPart.tsx` | `bg-sky` | 252 | prose (`<b>bg-sky</b>`) | `sky` (documentation) |
| `parts/HeroPart.tsx` | `border-frost` | 167, 218, 220 | class | `frost` |
| `parts/HeroPart.tsx` | `text-pine` | 129, 221 | class | `pine` |
| `parts/HeroPart.tsx` | `text-pine/90` | 222, 247 | class | `pine` @ 90% |
| `parts/PrimitivesPart.tsx` | `bg-cloud` | 294, 298 | class | `cloud` |
| `parts/PrimitivesPart.tsx` | `bg-frost` | 498 | class | `frost` |
| `parts/PrimitivesPart.tsx` | `hover:bg-frost` | 509 | class | `frost` |
| `parts/PrimitivesPart.tsx` | `border-frost` | 151, 152, 155, 163, 275, 294, 420, 498, 509 | class | `frost` |
| `parts/PrimitivesPart.tsx` | `border-stone/60` | 277 | class | `stone` @ 60% |
| `parts/PrimitivesPart.tsx` | `text-pine` | 151, 277, 416, 498, 509, 527, 532 | class | `pine` |
| `parts/PrimitivesPart.tsx` | `text-pine/90` | 153, 157, 165, 417, 513 | class | `pine` @ 90% |
| `parts/PrimitivesPart.tsx` | `focus-visible:outline-pine` | 509 | class | `pine` |
| `parts/PrimitivesPart.tsx` | `bg-fern` | 87 | prose (`<b>bg-fern</b>`) | `fern` (documentation) |
| `parts/PrimitivesPart.tsx` | `bg-brick`, `text-cloud` | 153 | prose (span text) | `brick`, `cloud` (documentation) |
| `parts/PrimitivesPart.tsx` | `to-frost`, `to-cloud` | 382, 400, 406, 438 | artifact (variant names in prose/data) | n/a |
| `parts/TokensPart.tsx` | `bg-sky` | 42 | data → swatch (`:120`) | `sky` |
| `parts/TokensPart.tsx` | `bg-horizon` | 49 | data → swatch (`:120`) | `horizon` |
| `parts/TokensPart.tsx` | `bg-cloud` | 59 | data → swatch (`:120`) | `cloud` |
| `parts/TokensPart.tsx` | `bg-frost` | 66 | data → swatch (`:120`) | `frost` |
| `parts/TokensPart.tsx` | `bg-brick` | 74 | data → swatch (`:120`) | `brick` |
| `parts/TokensPart.tsx` | `bg-stone` | 81 | data → swatch (`:120`) | `stone` |
| `parts/TokensPart.tsx` | `bg-pine` | 88 | data → swatch (`:120`) | `pine` |
| `parts/TokensPart.tsx` | `bg-haze` | 96 | data → swatch (`:120`) | `haze` |
| `parts/TokensPart.tsx` | `bg-fern` | 106 | data → swatch (`:120`) | `fern` |
| `parts/TokensPart.tsx` | `bg-sky`, `bg-fern` | 7 | comment | documentation |
| `parts/TokensPart.tsx` | `border-frost` | 117, 120, 244, 295, 319 | class | `frost` |
| `parts/TokensPart.tsx` | `border-stone/60` | 127, 135 | class | `stone` @ 60% |
| `parts/TokensPart.tsx` | `text-pine` | 123, 132, 135, 246, 259, 334, 346 | class | `pine` |
| `parts/TokensPart.tsx` | `text-pine/90` | 125, 127, 133, 247, 250, 252, 337, 340, 349, 353 | class | `pine` @ 90% |
| `parts/TokensPart.tsx` | nine `#RRGGBB` strings | 41, 48, 58, 65, 73, 80, 87, 95, 105 | data → rendered as label text (`:125`) | the nine tokens |
| `parts/TokensPart.tsx` | `#339966`, `#42B872` | 111 | prose | source-art greens (documentation) |
| `sheet.css` | — | — | — | no colour declarations (`src/sheet/sheet.css:30–63` sets opacity/transform/font-weight only) |

`components.html` contains no colour: C1, C5, C9 and C10 all return zero rows for it.

**Off-palette count in the sheet: 0.** Everything resolves to a token.

### 3.2 Rule results for the sheet

| Rule | Result | Note |
| --- | --- | --- |
| brick-only accent | PASS | `brick` only at `ComponentSheet.tsx:81,159` (link hover) and the `bg-brick` swatch/prose |
| fern logo-only | **FAIL (sheet-only, note)** | `bg-fern` paints a 56px swatch square at `parts/TokensPart.tsx:106` → `:120`, which is a background outside the two brand marks (README:201). See P3-7 |
| haze not text | PASS | `bg-haze` at `parts/TokensPart.tsx:96` is a swatch background, never text |
| no off-palette colours | PASS | C3/C4/C5 all clean for `src/sheet/` |
| link hover in one place | **FAIL (sheet-only, note)** | `hover:text-brick` / `group-hover:text-brick` hand-rolled at `ComponentSheet.tsx:81,159` instead of importing `LINK_ON_CLOUD`. See P3-8 |

---

## 4. Findings

### P3-1 — low — A third hover treatment lives inline in `SiteHeader`, outside both link constants and `ButtonLink`

- Evidence: `src/components/SiteHeader.tsx:77` — `hover:bg-frost` on the mobile menu
  toggle, which is a real `<button>` (`src/components/SiteHeader.tsx:71`). The identical
  inline pattern is duplicated twice more inside the sheet
  (`src/sheet/ComponentSheet.tsx:95`, `src/sheet/parts/PrimitivesPart.tsx:509`).
- Expected: README:204 — “Link hover is a per-surface rule, and it lives in one place.”
  The toggle is not a link, so it is outside the letter of README:204–207, but the system
  has no documented home for a non-link hover colour, and this one is now copy-pasted in
  three files.
- Fix: export the toggle treatment as one named constant (next to `LINK_ON_CLOUD` /
  `LINK_ON_FROST`, or in `ButtonLink.tsx` as an icon-button variant) and reference it from
  all three sites; add one README line covering button-surface hover.

### P3-2 — low — README's `pine` role omits its two interactive uses

- Evidence: `pine` is the button hover fill (`src/components/ButtonLink.tsx:30`,
  `hover:bg-pine`) and the page's only focus-ring colour
  (`src/components/ExternalLink.tsx:30`, `src/components/ButtonLink.tsx:31`,
  `src/components/SiteHeader.tsx:51,77`, `src/App.tsx:30`).
- Expected: README:191 describes `pine` as “body text and headings (never pure black)” and
  README:189 says hover belongs to `brick`. The component sheet already documents the
  wider role (`src/sheet/parts/TokensPart.tsx:89`: “All text, all focus rings, and the
  button's hover fill”); the README does not, so the README table and the shipped code
  disagree about what `pine` is for.
- Fix: extend README:191's role cell to “body text, headings, focus rings and the button
  hover fill”, matching `src/sheet/parts/TokensPart.tsx:89`.

### P3-3 — low — `haze` is now entirely unused, but only `horizon` is flagged as unused

- Evidence: command C1 returns **no** `haze` row for any landing-page file. Its sole
  repo-wide appearance is the sheet's own swatch (`src/sheet/parts/TokensPart.tsx:96`),
  which exists to document it.
- Expected: README:186 flags `horizon` as “**currently unused**”, while README:192 still
  assigns `haze` a live role (“scene colour only”) and README:196–197 describes it only as
  retired *from text*. The palette therefore has two dead tokens, one of which reads as
  live. `src/sheet/parts/TokensPart.tsx:98` already says “No uses in src/.”
- Fix: mark `haze` **unused** in the README table the same way `horizon` is, or delete both
  and drop the palette to seven tokens.

### P3-4 — note — a raw hex lives in a source comment outside `@theme`

- Evidence: `src/App.tsx:44` — “the bottom 20 rows of Campus.png average `#ccc3ad`, a warm
  sand-grey”. It is the only hex in `src/` that is neither a token definition nor a
  restatement of one (`src/index.css:55`, `src/components/ExternalLink.tsx:12,14` are
  restatements).
- Expected: README:179–181 — “no arbitrary hex”. The rule is aimed at painted colour and
  this value paints nothing, so it is a note rather than a violation.
- Fix: none required; if a future grep-based colour lint is added, exempt comments
  explicitly rather than rewording this one.

### P3-5 — note — README:205's “the only two link treatments on the page” is contradicted by two links that use neither

- Evidence: `src/components/ButtonLink.tsx:53` renders an `<a>` (via `ExternalLink`) with
  its own hover colour (`src/components/ButtonLink.tsx:30`, `hover:bg-pine`), and the
  header logo link (`src/components/SiteHeader.tsx:49–52`) carries a focus ring only.
- Expected: README:204–207. Both are legitimate — README:238 names `ButtonLink` “the
  page's one button treatment”, and `src/components/ExternalLink.tsx:8` scopes the rule
  correctly with “Every **text** link on the page uses one of the two strings below”. The
  README sentence is simply looser than the source comment.
- Fix: change README:205 to “the only two **text-link** treatments on the page”, matching
  `src/components/ExternalLink.tsx:8`.

### P3-6 — note — no `<meta name="theme-color">` on either entry point

- Evidence: command C10 returns nothing; `index.html:1–80` and `components.html:1–35`
  contain no `theme-color`, no `color-scheme` and no `prefers-color-scheme`.
- Expected: nothing in the README requires one, so this is an observation, not a
  violation: mobile browser chrome falls back to the UA default rather than `cloud`
  (`#f7f5ee`) or `sky` (`#4a96d2`).
- Fix: optional — add `<meta name="theme-color" content="#f7f5ee">` to `index.html` if the
  address-bar tint should match the page ground.

### P3-7 — note (sheet-only) — `bg-fern` paints a swatch background in the component sheet

- Evidence: `src/sheet/parts/TokensPart.tsx:106` (`swatch: 'bg-fern'`) applied at
  `src/sheet/parts/TokensPart.tsx:120` to a 56/64px rounded square.
- Expected: README:201 — fern “fills the marks and nothing else: no link, button, border,
  background or text”. A swatch is literally a background. Lower stakes: the sheet is
  internal, `noindex` (`components.html:17`), excluded from the landing bundle
  (`src/landing.css:22`), and the swatch's whole purpose is to show the token — the same
  file's own copy at `src/sheet/parts/TokensPart.tsx:111` restates the restriction.
- Fix: none needed; if the rule is ever machine-checked, exempt
  `src/sheet/parts/TokensPart.tsx` explicitly.

### P3-8 — note (sheet-only) — the sheet hand-rolls the cloud link treatment instead of importing it

- Evidence: `src/sheet/ComponentSheet.tsx:81` (`text-pine hover:text-brick
  focus-visible:outline-pine`) and `src/sheet/ComponentSheet.tsx:159`
  (`group-hover:text-brick`) reproduce `LINK_ON_CLOUD`
  (`src/components/ExternalLink.tsx:33`) by hand.
- Expected: README:204–205 — link hover “lives in one place”. Values currently agree, so
  nothing renders wrong; the risk is drift if `LINK_ON_CLOUD` changes.
- Fix: import `LINK_ON_CLOUD` in `src/sheet/ComponentSheet.tsx` and compose it, as
  `src/components/SiteHeader.tsx:27` does.

### Not findings — checked and clean

Listed so the absence is on the record: default Tailwind palette utilities (C3, zero);
`black`/`white`/`transparent`/`current`/`inherit` colour utilities (C4, zero);
`rgb()`/`hsl()`/`oklch()`/`color-mix()`/`[#…]` arbitrary colours (C5, zero outside
`@theme` and comments); raw CSS colour declarations (C6, zero — all five hits are a TS
property named `background` holding a class string); `var(--color-*)` reference sites (C7,
zero); SVG `fill`/`stroke` attributes (C8, two, both `none`/`currentColor`); inline `style`
colour (C9, zero); `theme-color`/`color-scheme`/`dark:` (C10, zero); `shadow-*`, `ring-*`,
`backdrop-*`, `mix-blend-*`, `bg-blend-*` (C11, zero); gradient utilities and their colour
stops (C13, zero); CSS mask colour (mask is `url()` only, `src/index.css:158–176`).

---

## 5. For Phase 4 (a11y contrast): foreground/background pairs actually used

Every foreground/background token pair that occurs in the **landing page**, with one
`file:line` each. Backgrounds are resolved by the nearest painting ancestor, not by the
element itself.

| Foreground | Background | Where (`file:line`) | What |
| --- | --- | --- | --- |
| `text-pine` | `bg-cloud` | fg `src/components/sections/IntroSection.tsx:40` / bg `src/components/sections/IntroSection.tsx:34` | the page's only `<h1>` |
| `text-pine` | `bg-cloud` | fg `src/components/Layout.tsx:99` / bg `src/components/sections/AboutSection.tsx:29` | section `<h2>` (`SectionHeader`) |
| `text-pine` | `bg-cloud` | fg `src/components/Layout.tsx:103` / bg `src/components/sections/QuestionsSection.tsx:32` | section lede |
| `text-pine` | `bg-cloud` | fg `src/components/sections/AboutSection.tsx:50` / bg `src/components/sections/AboutSection.tsx:44` | body copy inside the pillar card |
| `text-pine` | `bg-cloud` | fg `src/components/sections/QuestionsSection.tsx:47,50` / bg `src/components/sections/QuestionsSection.tsx:32` | question `<dt>` and answer `<dd>` |
| `text-pine` | `bg-cloud` | fg `src/App.tsx:27` / bg `src/App.tsx:27` | page-root default text colour |
| `text-pine` | `bg-cloud` | fg `src/components/SiteHeader.tsx:77` / bg `src/components/SiteHeader.tsx:47` | menu-toggle glyph (`stroke="currentColor"`, `src/components/SiteHeader.tsx:127`) |
| `text-pine` (link rest) | `bg-cloud` | fg `src/components/ExternalLink.tsx:33` / bg `src/components/SiteHeader.tsx:47` | nav links (`src/components/SiteHeader.tsx:27`) |
| `text-pine` (link rest) | `bg-cloud` | fg `src/components/ExternalLink.tsx:33` / bg `src/components/sections/ContactSection.tsx:17` | the two large contact links (`src/components/sections/ContactSection.tsx:7–9`) |
| `text-pine/90` | `bg-cloud` | fg `src/components/Layout.tsx:74` / bg `src/components/sections/AboutSection.tsx:29` | every eyebrow |
| `text-pine/90` | `bg-cloud` | fg `src/components/sections/IntroSection.tsx:53` / bg `src/components/sections/IntroSection.tsx:34` | “Free, open to all majors.” caption |
| `text-pine/90` | `bg-cloud` | fg `src/components/sections/AboutSection.tsx:51` / bg `src/components/sections/AboutSection.tsx:44` | pillar meta line, on the card |
| `text-pine/90` | `bg-cloud` | fg `src/components/sections/ContactSection.tsx:34,47` / bg `src/components/sections/ContactSection.tsx:17` | contact captions |
| **`text-brick` (hover)** | `bg-cloud` | fg `src/components/ExternalLink.tsx:33` / bg `src/components/SiteHeader.tsx:47` | `LINK_ON_CLOUD` hover — README:206 claims 4.78:1 |
| `text-pine` | `bg-frost` | fg `src/components/sections/GetInvolvedSection.tsx:37,40` / bg `src/components/sections/GetInvolvedSection.tsx:34` | CTA card headline + body |
| `text-pine` (link rest) | `bg-frost` | fg `src/components/ExternalLink.tsx:37` / bg `src/components/SiteFooter.tsx:21` | footer links (`src/components/SiteFooter.tsx:14`) |
| `text-pine` (link rest) | `bg-frost` | fg `src/components/ExternalLink.tsx:37` / bg `src/components/sections/GetInvolvedSection.tsx:34` | mailing-list link (`src/components/sections/GetInvolvedSection.tsx:60`) |
| `text-pine/90` | `bg-frost` | fg `src/components/SiteFooter.tsx:26,42` / bg `src/components/SiteFooter.tsx:21` | footer blurb + copyright |
| `text-pine/90` | `bg-frost` | fg `src/components/Layout.tsx:74` / bg `src/components/SiteFooter.tsx:21` | footer column headings (`Eyebrow as="h2"`, `src/components/SiteFooter.tsx:60`) |
| `text-pine/90` | `bg-frost` | fg `src/components/sections/GetInvolvedSection.tsx:55` / bg `src/components/sections/GetInvolvedSection.tsx:34` | mailing-list caption on the card |
| `text-pine` | `bg-frost` (hover) | fg `src/components/SiteHeader.tsx:77` / bg `src/components/SiteHeader.tsx:77` | menu toggle in its hover state |
| **`text-cloud`** | **`bg-brick`** | fg + bg `src/components/ButtonLink.tsx:30` | every Discord CTA label (`src/components/sections/IntroSection.tsx:50`, `src/components/sections/GetInvolvedSection.tsx:46`, `src/components/SiteHeader.tsx:66,104`) |
| **`text-cloud`** | **`bg-pine` (hover)** | fg + bg `src/components/ButtonLink.tsx:30` | the same CTA, hovered |
| `border-frost` | `bg-cloud` | `src/components/sections/AboutSection.tsx:44`, `src/components/sections/QuestionsSection.tsx:41,45`, `src/components/SiteHeader.tsx:47,90` | non-text UI boundaries — WCAG 1.4.11 |
| `border-frost` | `bg-frost` | `src/components/sections/GetInvolvedSection.tsx:34` | **frost border on a frost fill** — zero contrast by construction; check whether it is meant to be visible |
| `border-stone/60` | `bg-frost` | `src/components/SiteFooter.tsx:37`, `src/components/sections/GetInvolvedSection.tsx:55` | hairline rules |
| `outline-pine` (focus) | `bg-cloud` | `src/components/ExternalLink.tsx:30`, `src/components/SiteHeader.tsx:51`, `src/App.tsx:30` | focus ring, offset 4 (offset 2 on `ButtonLink`) — README claims 6.83:1 |
| `outline-pine` (focus) | `bg-frost` | `src/components/ExternalLink.tsx:30` via `src/components/SiteFooter.tsx:14` | focus ring on the footer band — README claims 5.76:1 |
| `bg-fern` | `bg-cloud` | fg `src/components/Wordmark.tsx:52,56` / bg `src/components/SiteHeader.tsx:47` | logo lockup in the header — logotype, WCAG-exempt (README:202) |
| `bg-fern` | `bg-frost` | fg `src/components/Wordmark.tsx:52,56` / bg `src/components/SiteFooter.tsx:21` | logo lockup in the footer — logotype, WCAG-exempt |

**Nothing at all sits on `sky`.** `bg-sky` occurs once (`src/components/Hero.tsx:176`), as
the hero track's background behind an opaque `object-cover` illustration; the hero carries
no text and no focusable elements by design (README:216–218,
`src/components/Hero.tsx:23–28`). There is no `sky` foreground/background pair to test.

Also worth Phase 4's attention:

- `text-pine/90` is an **alpha** tint, not a flat token, so its effective colour depends on
  what is behind it — `pine` at 90% over `cloud` and over `frost` give two different
  measured values. README:196–197 and `src/index.css:44–47` claim 5.36:1 on cloud and
  4.65:1 on frost; both are close enough to the 4.5:1 line that Phase 4 should recompute
  rather than inherit.
- Contrast claims already asserted in source, all unverified by this phase and worth
  re-measuring: `src/index.css:44–47` (haze 2.72/2.29, pine/90 5.36/4.65),
  `src/index.css:62` (fern 3.27/2.75), `src/components/ExternalLink.tsx:12–21`
  (brick-on-cloud 4.78, brick-on-frost 4.03, pine ring 6.83/5.76),
  `src/components/ButtonLink.tsx:21–22`, `src/components/sections/IntroSection.tsx:11–12`.
  Note that **no** source comment states the contrast of `text-cloud` on `bg-brick` or on
  `bg-pine` — the CTA label is the one pair nothing has measured.
- `border-frost` on `bg-frost` at `src/components/sections/GetInvolvedSection.tsx:34` is
  the only zero-contrast pair in the page.

---

## Commands run

All run from the repository root, Bash tool, POSIX syntax. Read-only; no file outside
`audit/` was created or modified.

**C1 — every palette-token utility (the table in §1.1 and §3.1 is this output):**

```
grep -rnoE '(text|bg|border|fill|stroke|ring|outline|shadow|from|via|to|decoration|accent|caret|placeholder|divide)-(sky|horizon|cloud|frost|brick|stone|pine|haze|fern)(/[0-9]+)?' src index.html components.html | sort
```

229 lines. Landing-page subset (80 lines) reproduced verbatim below; the sheet's 149 lines
are grouped in §3.1.

```
grep -rnoE '(text|bg|border|fill|stroke|ring|outline|shadow|from|via|to|decoration|accent|caret|placeholder|divide)-(sky|horizon|cloud|frost|brick|stone|pine|haze|fern)(/[0-9]+)?' src index.html components.html | grep -v '^src/sheet/' | sort -t: -k1,1 -k2,2n
```

```
src/App.tsx:27:bg-cloud
src/App.tsx:27:text-pine
src/App.tsx:30:bg-cloud
src/App.tsx:30:outline-pine
src/App.tsx:30:text-pine
src/App.tsx:45:to-cloud
src/App.tsx:50:bg-frost
src/App.tsx:71:to-frost
src/components/ButtonLink.tsx:30:bg-brick
src/components/ButtonLink.tsx:30:bg-pine
src/components/ButtonLink.tsx:30:text-cloud
src/components/ButtonLink.tsx:31:outline-pine
src/components/ExternalLink.tsx:30:outline-pine
src/components/ExternalLink.tsx:33:text-brick
src/components/ExternalLink.tsx:33:text-pine
src/components/ExternalLink.tsx:37:text-pine
src/components/Hero.tsx:176:bg-sky
src/components/HeroClouds.tsx:554:bg-cloud
src/components/Layout.tsx:74:text-pine/90
src/components/Layout.tsx:99:text-pine
src/components/Layout.tsx:103:text-pine
src/components/SiteFooter.tsx:21:bg-frost
src/components/SiteFooter.tsx:26:text-pine/90
src/components/SiteFooter.tsx:37:border-stone/60
src/components/SiteFooter.tsx:42:text-pine/90
src/components/SiteHeader.tsx:22:bg-cloud
src/components/SiteHeader.tsx:47:bg-cloud
src/components/SiteHeader.tsx:47:border-frost
src/components/SiteHeader.tsx:51:outline-pine
src/components/SiteHeader.tsx:77:bg-frost
src/components/SiteHeader.tsx:77:border-frost
src/components/SiteHeader.tsx:77:outline-pine
src/components/SiteHeader.tsx:77:text-pine
src/components/SiteHeader.tsx:90:bg-cloud
src/components/SiteHeader.tsx:90:border-frost
src/components/SnowdriftDivider.tsx:17:to-frost
src/components/SnowdriftDivider.tsx:28:bg-frost
src/components/SnowdriftDivider.tsx:31:fill-cloud
src/components/SnowdriftDivider.tsx:35:fill-cloud
src/components/SnowdriftDivider.tsx:41:bg-frost
src/components/SnowdriftDivider.tsx:44:fill-cloud
src/components/SnowdriftDivider.tsx:48:fill-cloud
src/components/SnowdriftDivider.tsx:54:bg-frost
src/components/SnowdriftDivider.tsx:57:fill-cloud
src/components/SnowdriftDivider.tsx:61:fill-cloud
src/components/SnowdriftDivider.tsx:68:to-frost
src/components/SnowdriftDivider.tsx:69:bg-cloud
src/components/SnowdriftDivider.tsx:72:fill-frost
src/components/Wordmark.tsx:52:bg-fern
src/components/Wordmark.tsx:56:bg-fern
src/components/sections/AboutSection.tsx:29:bg-cloud
src/components/sections/AboutSection.tsx:44:bg-cloud
src/components/sections/AboutSection.tsx:44:border-frost
src/components/sections/AboutSection.tsx:47:text-pine
src/components/sections/AboutSection.tsx:50:text-pine
src/components/sections/AboutSection.tsx:51:text-pine/90
src/components/sections/ContactSection.tsx:17:bg-cloud
src/components/sections/ContactSection.tsx:34:text-pine/90
src/components/sections/ContactSection.tsx:47:text-pine/90
src/components/sections/GetInvolvedSection.tsx:14:bg-frost
src/components/sections/GetInvolvedSection.tsx:22:bg-cloud
src/components/sections/GetInvolvedSection.tsx:34:bg-frost
src/components/sections/GetInvolvedSection.tsx:34:border-frost
src/components/sections/GetInvolvedSection.tsx:37:text-pine
src/components/sections/GetInvolvedSection.tsx:40:text-pine
src/components/sections/GetInvolvedSection.tsx:55:border-stone/60
src/components/sections/GetInvolvedSection.tsx:55:text-pine/90
src/components/sections/IntroSection.tsx:12:text-pine
src/components/sections/IntroSection.tsx:12:text-pine/90
src/components/sections/IntroSection.tsx:34:bg-cloud
src/components/sections/IntroSection.tsx:40:text-pine
src/components/sections/IntroSection.tsx:44:text-pine
src/components/sections/IntroSection.tsx:53:text-pine/90
src/components/sections/QuestionsSection.tsx:32:bg-cloud
src/components/sections/QuestionsSection.tsx:41:border-frost
src/components/sections/QuestionsSection.tsx:45:border-frost
src/components/sections/QuestionsSection.tsx:47:text-pine
src/components/sections/QuestionsSection.tsx:50:text-pine
src/index.css:46:text-pine/90
src/index.css:117:bg-fern
```

Note: `outline-pine` rows are the tails of `focus:outline-pine` /
`focus-visible:outline-pine`; `-o` prints only the matched utility, so the variant prefix
is not shown. Variants are visible in C2 and in the `sed -n` confirmations.

**C2 — every `hover:` in the repo:**

```
grep -rnE 'hover:' src index.html components.html
```

```
src/components/ButtonLink.tsx:30:  'bg-brick text-cloud hover:bg-pine ' +
src/components/ExternalLink.tsx:33:export const LINK_ON_CLOUD = `text-pine hover:text-brick ${FOCUS_RING}`
src/components/ExternalLink.tsx:37:  'text-pine hover:underline hover:decoration-2 hover:underline-offset-4 ' +
src/components/SiteHeader.tsx:77:          className="border-frost text-pine hover:bg-frost focus-visible:outline-pine -mr-2 inline-flex items-center justify-center rounded-full border p-2 focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
src/sheet/ComponentSheet.tsx:81:                  className="text-caption text-pine hover:text-brick focus-visible:outline-pine block rounded-full px-3 py-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
src/sheet/ComponentSheet.tsx:95:            className="border-frost text-caption text-pine hover:bg-frost focus-visible:outline-pine shrink-0 rounded-full border px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2"
src/sheet/ComponentSheet.tsx:159:                <span className="text-body text-pine group-hover:text-brick font-medium sm:w-56 sm:shrink-0">
src/sheet/parts/PrimitivesPart.tsx:509:              className="border-frost text-caption text-pine hover:bg-frost focus-visible:outline-pine rounded-full border px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
```

**C3 — default Tailwind palette colour utilities (expected: no output):**

```
grep -rnE '(text|bg|border|fill|stroke|ring|outline|shadow|from|via|to|decoration|accent|caret|placeholder|divide)-(slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)' src index.html components.html
```

```
(no output)
```

**C4 — `black`/`white`/`transparent`/`current`/`inherit` colour utilities (expected: no output):**

```
grep -rnoE '(text|bg|border|fill|stroke|ring|outline|shadow|decoration|divide|from|via|to)-(black|white|transparent|current|inherit)(/[0-9]+)?' src index.html components.html
```

```
(no output)
```

**C5 — raw hex, `rgb()`, `hsl()`, `oklch()`, `color-mix()`, arbitrary `[#…]`:**

```
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(|hsla?\(|color-mix\(|\[#' src index.html components.html
```

```
src/App.tsx:44:         * rows of Campus.png average #ccc3ad, a warm sand-grey. A saturated
src/components/ExternalLink.tsx:12: *   **cloud** (`#F7F5EE`) — hover recolours to `brick`, which measures 4.78:1
src/components/ExternalLink.tsx:14: *   **frost** (`#DCE3EA`) — hover underlines instead. `brick` on frost measures
src/index.css:34:  --color-sky: #4a96d2;
src/index.css:35:  --color-horizon: #a8d0eb;
src/index.css:36:  --color-cloud: #f7f5ee;
src/index.css:37:  --color-frost: #dce3ea;
src/index.css:38:  --color-brick: #a2593a;
src/index.css:39:  --color-stone: #c4b79e;
src/index.css:40:  --color-pine: #3c5c48;
src/index.css:49:  --color-haze: #7c99b4;
src/index.css:55:   * #339966 on the bearcat, #42B872 on the wordmark — and neither was in the
src/index.css:67:  --color-fern: #339966;
src/sheet/parts/TokensPart.tsx:41:    hex: '#4A96D2',
src/sheet/parts/TokensPart.tsx:48:    hex: '#A8D0EB',
src/sheet/parts/TokensPart.tsx:58:    hex: '#F7F5EE',
src/sheet/parts/TokensPart.tsx:65:    hex: '#DCE3EA',
src/sheet/parts/TokensPart.tsx:73:    hex: '#A2593A',
src/sheet/parts/TokensPart.tsx:80:    hex: '#C4B79E',
src/sheet/parts/TokensPart.tsx:87:    hex: '#3C5C48',
src/sheet/parts/TokensPart.tsx:95:    hex: '#7C99B4',
src/sheet/parts/TokensPart.tsx:105:    hex: '#339966',
src/sheet/parts/TokensPart.tsx:111:      'The two source marks ship in different greens (#339966 and #42B872); painting both through this one token normalises them. It measures 3.27:1 on cloud and 2.75:1 on frost, so it must never appear on a link, a button, a border or any text — logotypes are exempt from WCAG 1.4.3 and 1.4.11, and nothing else here is.',
```

**C6 — raw CSS colour declarations:**

```
grep -rnE '(^|[^-a-z])(color|background|background-color|border-color|fill|stroke|box-shadow|outline-color|caret-color|text-decoration-color|accent-color)[[:space:]]*:' src index.html components.html
```

```
src/components/SnowdriftDivider.tsx:21:  background: string
src/components/SnowdriftDivider.tsx:28:    background: 'bg-frost',
src/components/SnowdriftDivider.tsx:41:    background: 'bg-frost',
src/components/SnowdriftDivider.tsx:54:    background: 'bg-frost',
src/components/SnowdriftDivider.tsx:69:    background: 'bg-cloud',
```

All five are the TypeScript property `background` on the `Shape` type
(`src/components/SnowdriftDivider.tsx:19–23`); the values are Tailwind class strings, not
CSS colours. Zero real CSS colour declarations exist in the project.

**C7 — `var(--color-*)` reference sites (expected: no output):**

```
grep -rnE 'var\(--color-' src index.html components.html
```

```
(no output)
```

**C8 — SVG colour attributes and `currentColor`:**

```
grep -rnE '(fill|stroke|stopColor|stop-color|floodColor)=|currentColor' src index.html components.html
```

```
src/components/SiteHeader.tsx:126:      fill="none"
src/components/SiteHeader.tsx:127:      stroke="currentColor"
```

**C9 — inline `style` props:**

```
grep -rnE 'style=\{|style="' src index.html components.html
```

```
src/components/Hero.tsx:212:                style={{ scale }}
src/components/HeroClouds.tsx:624:        style={style}
src/components/HeroClouds.tsx:639:      style={{ transform: `translateX(${index * 100}%)` }}
src/components/HeroClouds.tsx:646:          style={{
src/components/HeroClouds.tsx:670:          style={{
src/components/HeroClouds.tsx:739:        style={{ opacity: layer.opacity }}
src/components/HeroClouds.tsx:750:      style={{ opacity, y }}
src/components/HeroClouds.tsx:780:      style={{ '--cloud-sets': SET_COUNT } as CSSProperties}
src/components/Wordmark.tsx:53:        style={{ height: `${BEARCAT_EM}em`, aspectRatio: aspect(BEARCAT_MARK) }}
src/components/Wordmark.tsx:57:        style={{ height: `${WORDMARK_EM}em`, aspectRatio: aspect(WORDMARK_MARK) }}
```

None carries a colour. (`src/components/HeroClouds.tsx:646,670` open multi-line objects
whose keys are `left`/`top`/`width` and `left`/`bottom`/`height` respectively —
`src/components/HeroClouds.tsx:646–650` and `:670–674`.)

**C10 — `theme-color`, `color-scheme`, `dark:` (expected: no output):**

```
grep -rniE 'theme-color|color-scheme|colorScheme|prefers-color-scheme|dark:' src index.html components.html
```

```
(no output)
```

**C11 — `shadow-*`, `ring-*`, `backdrop-*`, blend utilities (expected: no output):**

```
grep -rnoE '(shadow|ring|backdrop|mix-blend|bg-blend)-[a-z0-9\[/-]+' src index.html components.html
```

```
(no output)
```

**C12 — the `@theme` colour tokens:**

```
grep -nE '^\s*--color-' src/index.css
```

```
34:  --color-sky: #4a96d2;
35:  --color-horizon: #a8d0eb;
36:  --color-cloud: #f7f5ee;
37:  --color-frost: #dce3ea;
38:  --color-brick: #a2593a;
39:  --color-stone: #c4b79e;
40:  --color-pine: #3c5c48;
49:  --color-haze: #7c99b4;
67:  --color-fern: #339966;
```

**C13 — gradients and mask colour:**

```
grep -rniE 'gradient|mask-image|mask:' src index.html components.html
```

```
src/index.css:57:   * are rendered as `mask-image` shapes filled with this one token (see
src/index.css:137: * but if a browser cannot parse it the whole `mask-image` declaration is
src/index.css:158:    -webkit-mask-image: url('/brand/bearcat-mask-64.png');
src/index.css:159:    mask-image: url('/brand/bearcat-mask-64.png');
src/index.css:163:    -webkit-mask-image: url('/brand/wordmark-mask-192.png');
src/index.css:164:    mask-image: url('/brand/wordmark-mask-192.png');
src/index.css:169:      -webkit-mask-image: url('/brand/bearcat-mask-128.png');
src/index.css:170:      mask-image: url('/brand/bearcat-mask-128.png');
src/index.css:174:      -webkit-mask-image: url('/brand/wordmark-mask-384.png');
src/index.css:175:      mask-image: url('/brand/wordmark-mask-384.png');
src/sheet/parts/PrimitivesPart.tsx:88:          <b>mask-image</b> alpha mask from <b>public/brand/</b>. The two source
src/sheet/parts/TokensPart.tsx:50:    role: 'A paler sky, declared for a gradient the finished page never used.',
```

No `linear-gradient`/`radial-gradient`/`conic-gradient` and no Tailwind gradient utility
anywhere; masks reference PNG alpha only and carry no colour.

**Line-number confirmation.** Every `file:line` cited above was re-read with
`sed -n '<n>p' <file>` after the greps — the landing-page citations in two batches
(`src/App.tsx`, `ButtonLink`, `ExternalLink`, `Hero`, `HeroClouds`, `Layout`, `SiteFooter`,
`SiteHeader`, `SnowdriftDivider`, `Wordmark`, all five `sections/*`), the README rule lines
with `sed -n '177,210p' README.md` plus
`grep -nE 'fern\` is the brand green|are the only two link treatments|is the \*\*only\*\* accent|currently unused|the single accent' README.md`, and
`sed -n '236,240p' README.md` for the layout table.
